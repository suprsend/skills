import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import { stringify as yamlStringify } from "yaml";

let srcDir: string;
let outDir: string;

vi.mock("../src/config.js", async () => {
  const { mkdtemp, mkdir } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");

  const base = await mkdtemp(join(tmpdir(), "skills-validation-test-"));
  const src = join(base, "skills-src");
  const out = join(base, "skills");
  await mkdir(src, { recursive: true });
  await mkdir(out, { recursive: true });

  (globalThis as Record<string, unknown>).__testSrcDir = src;
  (globalThis as Record<string, unknown>).__testOutDir = out;

  return {
    SKILLS_SRC_DIR: src,
    SKILLS_OUTPUT_DIR: out,
    MAX_SKILL_LINES: 500,
    MAX_NAME_LENGTH: 64,
    MAX_DESCRIPTION_LENGTH: 1024,
    MAX_COMPATIBILITY_LENGTH: 500,
    NAME_PATTERN: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    ANTHROPIC_API_KEY: "test-key",
    DEFAULT_MODEL: "claude-sonnet-4-20250514",
    DEFAULT_MAX_TOKENS: 4000,
    CACHE_DIR: join(base, ".cache"),
  };
});

vi.mock("../src/sources/claude.js", () => ({
  resolveClaude: vi.fn().mockResolvedValue("mocked"),
}));

import { build } from "../src/pipeline.js";

/** Helper: create a skill directory with sources.yaml, template, and static content */
async function createSkill(
  name: string,
  overrides: Record<string, unknown> = {},
  templateContent = "{{{content}}}",
  staticContent = "test content",
) {
  srcDir = (globalThis as Record<string, unknown>).__testSrcDir as string;
  outDir = (globalThis as Record<string, unknown>).__testOutDir as string;

  const skillDir = resolve(srcDir, name);
  const staticDir = resolve(skillDir, "static");
  await mkdir(staticDir, { recursive: true });

  const config = {
    name,
    description: "A valid test skill description.",
    sources: [{ type: "static", key: "content", path: "content.md" }],
    ...overrides,
  };

  const yaml = yamlStringify(config);
  await writeFile(resolve(skillDir, "sources.yaml"), yaml);
  await writeFile(resolve(skillDir, "template.md.hbs"), templateContent);
  await writeFile(resolve(staticDir, "content.md"), staticContent);
}

describe("agentskills.io validation", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("name field", () => {
    it("accepts valid lowercase name", async () => {
      await createSkill("my-skill");
      await expect(build({ skill: "my-skill" })).resolves.toBeUndefined();
    });

    it("accepts single-character name", async () => {
      await createSkill("a");
      await expect(build({ skill: "a" })).resolves.toBeUndefined();
    });

    it("accepts name with numbers", async () => {
      await createSkill("skill123");
      await expect(build({ skill: "skill123" })).resolves.toBeUndefined();
    });

    it("accepts name with hyphens", async () => {
      await createSkill("my-cool-skill");
      await expect(build({ skill: "my-cool-skill" })).resolves.toBeUndefined();
    });

    it("rejects name starting with hyphen", async () => {
      await createSkill("-bad-name", { name: "-bad-name" });
      await expect(build({ skill: "-bad-name" })).rejects.toThrow(
        /invalid skill name/i,
      );
    });

    it("rejects name ending with hyphen", async () => {
      await createSkill("bad-name-", { name: "bad-name-" });
      await expect(build({ skill: "bad-name-" })).rejects.toThrow(
        /invalid skill name/i,
      );
    });

    it("rejects name with uppercase letters", async () => {
      await createSkill("bad-name", { name: "Bad-Name" });
      await expect(build({ skill: "bad-name" })).rejects.toThrow();
    });

    it("rejects name with consecutive hyphens", async () => {
      await createSkill("bad--name", { name: "bad--name" });
      await expect(build({ skill: "bad--name" })).rejects.toThrow();
    });

    it("rejects name exceeding 64 characters", async () => {
      const longName = "a".repeat(65);
      await createSkill(longName, { name: longName });
      await expect(build({ skill: longName })).rejects.toThrow();
    });

    it("accepts name at exactly 64 characters", async () => {
      const name64 = "a".repeat(64);
      await createSkill(name64, { name: name64 });
      await expect(build({ skill: name64 })).resolves.toBeUndefined();
    });

    it("rejects name with spaces", async () => {
      await createSkill("bad-name", { name: "bad name" });
      await expect(build({ skill: "bad-name" })).rejects.toThrow();
    });

    it("rejects name with underscores", async () => {
      await createSkill("bad-name", { name: "bad_name" });
      await expect(build({ skill: "bad-name" })).rejects.toThrow();
    });

    it("rejects name with dots", async () => {
      await createSkill("bad-name", { name: "bad.name" });
      await expect(build({ skill: "bad-name" })).rejects.toThrow();
    });

    it("rejects empty name", async () => {
      await createSkill("empty-name", { name: "" });
      await expect(build({ skill: "empty-name" })).rejects.toThrow();
    });
  });

  describe("directory name matching", () => {
    it("rejects when directory name does not match skill name", async () => {
      await createSkill("dir-name", { name: "different-name" });
      await expect(build({ skill: "dir-name" })).rejects.toThrow();
    });

    it("accepts when directory name matches skill name", async () => {
      await createSkill("matching-name");
      await expect(
        build({ skill: "matching-name" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("description field", () => {
    it("rejects missing description", async () => {
      await createSkill("no-desc", { description: "" });
      await expect(build({ skill: "no-desc" })).rejects.toThrow();
    });

    it("rejects description exceeding 1024 characters", async () => {
      const longDesc = "x".repeat(1025);
      await createSkill("long-desc", { description: longDesc });
      await expect(build({ skill: "long-desc" })).rejects.toThrow();
    });

    it("accepts description at exactly 1024 characters", async () => {
      const desc1024 = "x".repeat(1024);
      await createSkill("exact-desc", { description: desc1024 });
      await expect(build({ skill: "exact-desc" })).resolves.toBeUndefined();
    });
  });

  describe("compatibility field", () => {
    it("accepts missing compatibility (optional)", async () => {
      await createSkill("no-compat");
      await expect(build({ skill: "no-compat" })).resolves.toBeUndefined();
    });

    it("rejects compatibility exceeding 500 characters", async () => {
      const longCompat = "x".repeat(501);
      await createSkill("long-compat", { compatibility: longCompat });
      await expect(build({ skill: "long-compat" })).rejects.toThrow();
    });

    it("accepts compatibility at exactly 500 characters", async () => {
      const compat500 = "x".repeat(500);
      await createSkill("exact-compat", { compatibility: compat500 });
      await expect(
        build({ skill: "exact-compat" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("duplicate source keys", () => {
    it("rejects sources with duplicate keys", async () => {
      await createSkill("dup-keys", {
        sources: [
          { type: "static", key: "content", path: "content.md" },
          { type: "static", key: "content", path: "content.md" },
        ],
      });
      await expect(build({ skill: "dup-keys" })).rejects.toThrow();
    });

    it("accepts sources with unique keys", async () => {
      await createSkill("unique-keys");
      await expect(
        build({ skill: "unique-keys" }),
      ).resolves.toBeUndefined();
    });
  });

  describe("line count warning", () => {
    it("warns when SKILL.md exceeds 500 lines", async () => {
      const warnSpy = vi.spyOn(console, "warn");
      const longContent = Array.from({ length: 600 }, (_, i) => `Line ${i}`).join("\n");
      await createSkill("long-skill", {}, "{{{content}}}", longContent);
      await build({ skill: "long-skill" });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]"),
        expect.stringContaining("500"),
      );
    });

    it("does not warn when SKILL.md is under 500 lines", async () => {
      const warnSpy = vi.spyOn(console, "warn");
      await createSkill("short-skill");
      await build({ skill: "short-skill" });
      // Filter for line count warnings specifically
      const lineWarnings = warnSpy.mock.calls.filter(
        (call) => typeof call[1] === "string" && call[1].includes("lines"),
      );
      expect(lineWarnings).toHaveLength(0);
    });
  });
});
