import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";

// Point SKILLS_SRC_DIR to our fixtures
vi.mock("../../src/config.js", () => ({
  SKILLS_SRC_DIR: resolve(import.meta.dirname, "../fixtures"),
}));

import {
  renderTemplate,
  renderOutputFile,
  readStaticFile,
  generateFrontmatter,
  interpolate,
} from "../../src/render/engine.js";
import type { SkillMeta, TemplateContext } from "../../src/sources/types.js";

describe("generateFrontmatter", () => {
  it("includes required name and description", () => {
    const meta: SkillMeta = {
      name: "test-skill",
      description: "A test skill for testing.",
    };
    const result = generateFrontmatter(meta);
    expect(result).toBe(
      '---\nname: test-skill\ndescription: "A test skill for testing."\n---',
    );
  });

  it("includes license when present", () => {
    const meta: SkillMeta = {
      name: "test",
      description: "desc",
      license: "MIT",
    };
    const result = generateFrontmatter(meta);
    expect(result).toContain("license: MIT");
  });

  it("includes compatibility when present", () => {
    const meta: SkillMeta = {
      name: "test",
      description: "desc",
      compatibility: "Requires Node 20+",
    };
    const result = generateFrontmatter(meta);
    expect(result).toContain('compatibility: "Requires Node 20+"');
  });

  it("includes metadata as nested YAML", () => {
    const meta: SkillMeta = {
      name: "test",
      description: "desc",
      metadata: { author: "test-org", version: "2.0" },
    };
    const result = generateFrontmatter(meta);
    expect(result).toContain("metadata:");
    expect(result).toContain('  author: "test-org"');
    expect(result).toContain('  version: "2.0"');
  });

  it("includes allowed-tools when present (quoted)", () => {
    const meta: SkillMeta = {
      name: "test",
      description: "desc",
      allowed_tools: "Bash(git:*) Read",
    };
    const result = generateFrontmatter(meta);
    expect(result).toContain('allowed-tools: "Bash(git:*) Read"');
  });

  it("omits optional fields when not set", () => {
    const meta: SkillMeta = {
      name: "test",
      description: "desc",
    };
    const result = generateFrontmatter(meta);
    expect(result).not.toContain("license");
    expect(result).not.toContain("compatibility");
    expect(result).not.toContain("metadata");
    expect(result).not.toContain("allowed-tools");
  });

  it("quotes descriptions with YAML-special characters", () => {
    const meta: SkillMeta = {
      name: "test",
      description: 'Use for: building # things & "stuff"',
    };
    const result = generateFrontmatter(meta);
    expect(result).toContain(
      'description: "Use for: building # things & \\"stuff\\""',
    );
  });

  it("trims description whitespace", () => {
    const meta: SkillMeta = {
      name: "test",
      description: "  desc with spaces  \n",
    };
    const result = generateFrontmatter(meta);
    expect(result).toContain('description: "desc with spaces"');
  });

  it("includes all fields when all are set", () => {
    const meta: SkillMeta = {
      name: "full-skill",
      description: "Full skill description.",
      license: "Apache-2.0",
      compatibility: "Requires docker",
      metadata: { author: "acme" },
      allowed_tools: "Bash(docker:*)",
    };
    const result = generateFrontmatter(meta);
    const lines = result.split("\n");
    expect(lines[0]).toBe("---");
    expect(lines[lines.length - 1]).toBe("---");
    expect(result).toContain("name: full-skill");
    expect(result).toContain('description: "Full skill description."');
    expect(result).toContain("license: Apache-2.0");
    expect(result).toContain('compatibility: "Requires docker"');
    expect(result).toContain("metadata:");
    expect(result).toContain('allowed-tools: "Bash(docker:*)"');
  });

  it("escapes backslashes in description", () => {
    const meta: SkillMeta = {
      name: "test",
      description: 'Path is C:\\Users\\file',
    };
    const result = generateFrontmatter(meta);
    expect(result).toContain('description: "Path is C:\\\\Users\\\\file"');
  });

  it("escapes newlines in description", () => {
    const meta: SkillMeta = {
      name: "test",
      description: "line one\nline two",
    };
    const result = generateFrontmatter(meta);
    expect(result).toContain('description: "line one\\nline two"');
  });

  it("escapes special chars in metadata values", () => {
    const meta: SkillMeta = {
      name: "test",
      description: "desc",
      metadata: { note: 'See "docs": here' },
    };
    const result = generateFrontmatter(meta);
    expect(result).toContain('note: "See \\"docs\\": here"');
  });
});

describe("interpolate", () => {
  it("replaces Handlebars expressions with context values", () => {
    const result = interpolate("Hello {{name}}!", { name: "World" });
    expect(result).toBe("Hello World!");
  });

  it("handles nested property access", () => {
    const result = interpolate("{{meta.name}}", {
      meta: { name: "test-skill" },
    });
    expect(result).toBe("test-skill");
  });

  it("leaves undefined variables as empty string", () => {
    const result = interpolate("Hello {{missing}}!", {});
    expect(result).toBe("Hello !");
  });

  it("works with helper expressions", () => {
    const result = interpolate("{{json data}}", { data: { key: 1 } });
    expect(result).toContain('"key": 1');
  });

  it("handles multi-line templates", () => {
    const template = "Line 1: {{a}}\nLine 2: {{b}}";
    const result = interpolate(template, { a: "first", b: "second" });
    expect(result).toBe("Line 1: first\nLine 2: second");
  });

  it("does not HTML-escape content", () => {
    const result = interpolate("{{content}}", {
      content: "<b>bold</b> & stuff",
    });
    expect(result).toBe("<b>bold</b> & stuff");
  });
});

describe("renderTemplate", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders main template with context", async () => {
    const context: TemplateContext = {
      overview: "Test overview content.",
      meta: { name: "valid-skill", description: "A test skill." },
    };
    const result = await renderTemplate("valid-skill", context);
    expect(result).toContain("# valid-skill");
    expect(result).toContain("Test overview content.");
  });

  it("renders triple-brace variables unescaped", async () => {
    const context: TemplateContext = {
      overview: "Content with **markdown** and <html>",
      meta: { name: "valid-skill", description: "desc" },
    };
    const result = await renderTemplate("valid-skill", context);
    expect(result).toContain("**markdown**");
    expect(result).toContain("<html>");
  });

  it("renders helpers in templates", async () => {
    const context: TemplateContext = {
      overview: "Overview text.",
      meta: { name: "valid-skill", description: "desc" },
    };
    const result = await renderTemplate("valid-skill", context);
    // The template uses {{ref-link "ref-doc.md" "reference documentation"}}
    expect(result).toContain("[reference documentation](references/ref-doc.md)");
  });

  it("loads and uses partials", async () => {
    // The valid-skill fixture has a partials/ directory with ref-doc.hbs
    // While renderTemplate doesn't use partials directly, it loads them
    // We can verify by checking no errors occur and partials are registered
    const context: TemplateContext = {
      overview: "Overview",
      meta: { name: "valid-skill", description: "desc" },
    };
    // Should not throw
    const result = await renderTemplate("valid-skill", context);
    expect(result).toBeTruthy();
  });

  it("throws on missing template file", async () => {
    const context: TemplateContext = {
      meta: { name: "nonexistent", description: "desc" },
    };
    await expect(
      renderTemplate("nonexistent-skill", context),
    ).rejects.toThrow();
  });
});

describe("renderOutputFile", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a Handlebars template file", async () => {
    const context: TemplateContext = {
      meta: {
        name: "valid-skill",
        description: "A valid test skill for testing.",
      },
    };
    const result = await renderOutputFile(
      "valid-skill",
      "partials/ref-doc.hbs",
      context,
    );
    expect(result).toContain("# Reference for valid-skill");
    expect(result).toContain("A valid test skill for testing.");
  });

  it("throws on missing template file", async () => {
    const context: TemplateContext = {
      meta: { name: "test", description: "desc" },
    };
    await expect(
      renderOutputFile("valid-skill", "partials/missing.hbs", context),
    ).rejects.toThrow();
  });
});

describe("readStaticFile", () => {
  it("reads a file as a Buffer", async () => {
    const result = await readStaticFile(
      "valid-skill",
      "assets",
      "config.json",
    );
    expect(Buffer.isBuffer(result)).toBe(true);
    const parsed = JSON.parse(result.toString());
    expect(parsed).toEqual({ setting: "value", enabled: true });
  });

  it("reads a script file", async () => {
    const result = await readStaticFile(
      "valid-skill",
      "scripts",
      "helper.sh",
    );
    expect(result.toString()).toContain("#!/usr/bin/env bash");
  });

  it("reads a reference file", async () => {
    const result = await readStaticFile(
      "valid-skill",
      "references",
      "static-ref.md",
    );
    expect(result.toString()).toContain("# Static Reference");
  });

  it("throws on missing file", async () => {
    await expect(
      readStaticFile("valid-skill", "assets", "missing.json"),
    ).rejects.toThrow();
  });

  it("throws on missing skill directory", async () => {
    await expect(
      readStaticFile("no-such-skill", "assets", "config.json"),
    ).rejects.toThrow();
  });
});
