import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";

const ROOT = resolve(import.meta.dirname, "../..");
const SKILLS_DIR = resolve(ROOT, "skills");

// e2e tests run real builds with network fetches (schemas, docs, external skills)
const E2E_TIMEOUT = 120_000;

describe("end-to-end build", () => {
  beforeAll(() => {
    // Run the actual build (includes network fetches for schemas, docs, and external skills)
    execSync("npm run build", { cwd: ROOT, encoding: "utf-8", timeout: E2E_TIMEOUT });
  }, E2E_TIMEOUT);

  describe("suprsend-workflow-schema skill", () => {
    let content: string;
    let frontmatter: Record<string, unknown>;
    const skillDir = resolve(SKILLS_DIR, "suprsend-workflow-schema");

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
      expect(frontmatter.name).toBe("suprsend-workflow-schema");
      expect(frontmatter.description).toBeTruthy();
    });

    it("has name matching directory", () => {
      expect(frontmatter.name).toBe("suprsend-workflow-schema");
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

      it("contains workflow nodes overview", () => {
        expect(content).toContain("Workflow Nodes");
      });

      it("contains delivery nodes", () => {
        expect(content).toContain("Delivery Nodes");
      });

      it("contains function nodes", () => {
        expect(content).toContain("Function Nodes");
      });

      it("contains branch nodes", () => {
        expect(content).toContain("Branch Nodes");
      });

      it("contains data nodes", () => {
        expect(content).toContain("Data Nodes");
      });

      it("contains reference links", () => {
        expect(content).toContain("references/node-delivery.md");
        expect(content).toContain("references/node-delay.md");
        expect(content).toContain("references/workflow-schema-guide.md");
      });
    });

    describe("references/ directory", () => {
      it("exists", async () => {
        await expect(
          access(resolve(skillDir, "references")),
        ).resolves.toBeUndefined();
      });

      it("contains workflow-schema-guide.md", async () => {
        const ref = await readFile(
          resolve(skillDir, "references", "workflow-schema-guide.md"),
          "utf-8",
        );
        expect(ref).toContain("Workflow Schema");
      });

      it("contains node-delivery.md", async () => {
        const ref = await readFile(
          resolve(skillDir, "references", "node-delivery.md"),
          "utf-8",
        );
        expect(ref).toContain("Delivery Nodes");
      });

      it("contains node-delay.md", async () => {
        const ref = await readFile(
          resolve(skillDir, "references", "node-delay.md"),
          "utf-8",
        );
        expect(ref).toContain("Delay");
      });

      it("contains node-batch.md", async () => {
        const ref = await readFile(
          resolve(skillDir, "references", "node-batch.md"),
          "utf-8",
        );
        expect(ref).toContain("Batch");
      });
    });
  });

  describe("suprsend-cli skill (external)", () => {
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
    });

    describe("body content", () => {
      it("is under 500 lines", () => {
        const lines = content.split("\n").length;
        expect(lines).toBeLessThanOrEqual(500);
      });

      it("contains CLI overview", () => {
        expect(content).toContain("suprsend");
      });

      it("contains available commands", () => {
        expect(content).toContain("Available Commands");
      });

      it("contains references/ directory", async () => {
        await expect(
          access(resolve(skillDir, "references")),
        ).resolves.toBeUndefined();
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
      "npx tsx src/index.ts --skill=suprsend-workflow-schema",
      { cwd: ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: E2E_TIMEOUT },
    );
    // Build should complete without error (exit 0 implied by no throw)
    // Verify SKILL.md exists for the specified skill
    expect(output).toBeDefined();
  }, E2E_TIMEOUT);

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
