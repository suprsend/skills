import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolve } from "node:path";

// Mock config before importing the module under test
vi.mock("../../src/config.js", () => ({
  SKILLS_SRC_DIR: resolve(import.meta.dirname, "../fixtures"),
}));

import { resolveStatic } from "../../src/sources/static.js";
import type { StaticSource } from "../../src/sources/types.js";

describe("resolveStatic", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads a file from skills-src/<skill>/static/<path>", async () => {
    const source: StaticSource = {
      type: "static",
      key: "overview",
      path: "overview.md",
    };
    const result = await resolveStatic("valid-skill", source);
    expect(result).toContain("overview content for the test skill");
  });

  it("returns the full file content as a string", async () => {
    const source: StaticSource = {
      type: "static",
      key: "overview",
      path: "overview.md",
    };
    const result = await resolveStatic("valid-skill", source);
    expect(typeof result).toBe("string");
    expect(result).toContain("**markdown**");
  });

  it("throws on missing file", async () => {
    const source: StaticSource = {
      type: "static",
      key: "missing",
      path: "nonexistent.md",
    };
    await expect(resolveStatic("valid-skill", source)).rejects.toThrow();
  });

  it("throws on missing skill directory", async () => {
    const source: StaticSource = {
      type: "static",
      key: "overview",
      path: "overview.md",
    };
    await expect(resolveStatic("no-such-skill", source)).rejects.toThrow();
  });

  it("throws on path traversal attempt", async () => {
    const source: StaticSource = {
      type: "static",
      key: "malicious",
      path: "../../package.json",
    };
    await expect(resolveStatic("valid-skill", source)).rejects.toThrow(
      /path traversal/i,
    );
  });
});
