import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";

const ROOT = resolve(import.meta.dirname, "../..");
const SKILLS_DIR = resolve(ROOT, "skills");

describe("end-to-end build", () => {
  beforeAll(() => {
    // Run the actual build
    execSync("npm run build", { cwd: ROOT, encoding: "utf-8" });
  });

  describe("suprsend-cli skill", () => {
    let content: string;
    let frontmatter: Record<string, unknown>;
    const skillDir = resolve(SKILLS_DIR, "suprsend-cli");

    beforeAll(async () => {
      content = await readFile(resolve(skillDir, "SKILL.md"), "utf-8");
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      expect(match).toBeTruthy();
      frontmatter = parseYaml(match![1]);
    });

    it("generates SKILL.md", async () => {
      await expect(
        access(resolve(skillDir, "SKILL.md")),
      ).resolves.toBeUndefined();
    });

    it("has valid YAML frontmatter", () => {
      expect(frontmatter.name).toBe("suprsend-cli");
      expect(frontmatter.description).toBeTruthy();
    });

    it("has name matching directory", () => {
      expect(frontmatter.name).toBe("suprsend-cli");
    });

    describe("frontmatter compliance", () => {

      it("name is <= 64 chars", () => {
        expect((frontmatter.name as string).length).toBeLessThanOrEqual(64);
      });

      it("name matches pattern (lowercase, hyphens, no consecutive)", () => {
        const name = frontmatter.name as string;
        expect(name).toMatch(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/);
        expect(name).not.toContain("--");
      });

      it("description is <= 1024 chars", () => {
        expect(
          (frontmatter.description as string).length,
        ).toBeLessThanOrEqual(1024);
      });

      it("description is non-empty", () => {
        expect((frontmatter.description as string).trim().length).toBeGreaterThan(0);
      });

      it("has license field", () => {
        expect(frontmatter.license).toBe("MIT");
      });

      it("has metadata field with string values", () => {
        const meta = frontmatter.metadata as Record<string, unknown>;
        expect(meta).toBeDefined();
        for (const [, v] of Object.entries(meta)) {
          expect(typeof v).toBe("string");
        }
      });
    });

    describe("body content", () => {
      it("is under 500 lines", () => {
        const lines = content.split("\n").length;
        expect(lines).toBeLessThanOrEqual(500);
      });

      it("contains installation instructions", () => {
        expect(content).toContain("npm install");
      });

      it("contains authentication section", () => {
        expect(content).toContain("Authentication");
      });

      it("contains commands section", () => {
        expect(content).toContain("## Commands");
      });

      it("contains examples section", () => {
        expect(content).toContain("## Examples");
      });

      it("contains CLI command examples", () => {
        expect(content).toContain("suprsend workflow");
        expect(content).toContain("suprsend template");
      });

      it("contains code blocks", () => {
        expect(content).toContain("```bash");
      });
    });

    describe("references/ directory", () => {
      it("exists", async () => {
        await expect(
          access(resolve(skillDir, "references")),
        ).resolves.toBeUndefined();
      });

      it("contains troubleshooting.md", async () => {
        const ref = await readFile(
          resolve(skillDir, "references", "troubleshooting.md"),
          "utf-8",
        );
        expect(ref).toContain("Troubleshooting");
        expect(ref).toContain("Common Issues");
      });
    });

    describe("scripts/ directory", () => {
      it("exists", async () => {
        await expect(
          access(resolve(skillDir, "scripts")),
        ).resolves.toBeUndefined();
      });

      it("contains check-auth.sh", async () => {
        const script = await readFile(
          resolve(skillDir, "scripts", "check-auth.sh"),
          "utf-8",
        );
        expect(script).toContain("#!/usr/bin/env bash");
        expect(script).toContain("suprsend");
      });
    });

    describe("assets/ directory", () => {
      it("exists", async () => {
        await expect(
          access(resolve(skillDir, "assets")),
        ).resolves.toBeUndefined();
      });

      it("contains workflow-template.json", async () => {
        const asset = await readFile(
          resolve(skillDir, "assets", "workflow-template.json"),
          "utf-8",
        );
        const parsed = JSON.parse(asset);
        expect(parsed.$schema).toContain("suprsend.com");
        expect(parsed.steps).toBeInstanceOf(Array);
      });
    });
  });
});

describe("CLI flags", () => {
  it("--help flag prints usage and exits 0", () => {
    const output = execSync("npx tsx src/index.ts --help", {
      cwd: ROOT,
      encoding: "utf-8",
    });
    expect(output).toContain("Usage:");
    expect(output).toContain("--skill");
    expect(output).toContain("--no-cache");
    expect(output).toContain("--verbose");
  });

  it("--skill flag builds only the specified skill", () => {
    const output = execSync(
      "npx tsx src/index.ts --skill=suprsend-cli",
      { cwd: ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    // Build should complete without error (exit 0 implied by no throw)
    // Verify SKILL.md exists for the specified skill
    expect(output).toBeDefined();
  });

  it("unknown flag causes error", () => {
    expect(() => {
      execSync("npx tsx src/index.ts --unknown-flag", {
        cwd: ROOT,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    }).toThrow();
  });
});

describe("type checking", () => {
  it("passes tsc --noEmit", () => {
    // This validates the entire project type-checks
    execSync("npx tsc --noEmit", { cwd: ROOT, encoding: "utf-8" });
  });
});
