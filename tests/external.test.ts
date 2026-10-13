import { describe, it, expect, vi, beforeEach } from "vitest";
import { join } from "node:path";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";

vi.mock("../src/config.js", async () => {
  const { mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const out = await mkdtemp(join(tmpdir(), "skills-external-test-"));
  (globalThis as Record<string, unknown>).__testOutDir = out;
  return { SKILLS_OUTPUT_DIR: out };
});

const { fetchJson, fetchText } = vi.hoisted(() => ({ fetchJson: vi.fn(), fetchText: vi.fn() }));
vi.mock("../src/utils/fetch.js", () => ({ fetchJson, fetchText }));

// Lets a test make the staging -> target rename fail; every other rename is real.
const failSwap = vi.hoisted(() => ({ on: false }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    rename: async (from: string, to: string) => {
      if (failSwap.on && from.endsWith(".pull-tmp")) throw new Error("EXDEV: rename failed");
      return actual.rename(from, to);
    },
  };
});

import { pullExternalSkills } from "../src/external.js";

const outDir = () => (globalThis as Record<string, unknown>).__testOutDir as string;

// Remote: skills/demo/{SKILL.md, references/a.md}
function mockRemote(failOn?: string) {
  fetchJson.mockImplementation(async (url: string) => {
    if (url.includes("contents/skills?")) return [{ name: "demo", path: "skills/demo", type: "dir", download_url: null }];
    if (url.includes("contents/skills/demo?"))
      return [
        { name: "SKILL.md", path: "skills/demo/SKILL.md", type: "file", download_url: "raw/SKILL.md" },
        { name: "references", path: "skills/demo/references", type: "dir", download_url: null },
      ];
    if (url.includes("contents/skills/demo/references?"))
      return [{ name: "a.md", path: "skills/demo/references/a.md", type: "file", download_url: "raw/a.md" }];
    throw new Error(`unexpected ${url}`);
  });
  fetchText.mockImplementation(async (url: string) => {
    if (url === failOn) throw new Error("HTTP 403");
    return `content of ${url}`;
  });
}

describe("pullExternalSkills", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    failSwap.on = false;
    await rm(outDir(), { recursive: true, force: true });
    await mkdir(join(outDir(), "demo", "references"), { recursive: true });
    await writeFile(join(outDir(), "demo", "SKILL.md"), "old skill");
    await writeFile(join(outDir(), "demo", "references", "stale.md"), "removed upstream");
  });

  it("replaces the local copy, dropping files deleted upstream", async () => {
    mockRemote();
    await pullExternalSkills();
    expect(await readdir(join(outDir(), "demo", "references"))).toEqual(["a.md"]);
    expect(await readFile(join(outDir(), "demo", "SKILL.md"), "utf8")).toBe("content of raw/SKILL.md");
  });

  it("keeps the existing copy intact when the download fails midway", async () => {
    mockRemote("raw/a.md");
    await expect(pullExternalSkills()).rejects.toThrow("HTTP 403");
    expect(await readFile(join(outDir(), "demo", "SKILL.md"), "utf8")).toBe("old skill");
    expect(await readdir(join(outDir(), "demo", "references"))).toEqual(["stale.md"]);
    expect(await readdir(outDir())).toEqual(["demo"]); // no staging dir left behind
  });

  it("restores the existing copy when swapping in the new one fails", async () => {
    mockRemote();
    failSwap.on = true;
    await expect(pullExternalSkills()).rejects.toThrow("rename failed");
    expect(await readFile(join(outDir(), "demo", "SKILL.md"), "utf8")).toBe("old skill");
    expect(await readdir(join(outDir(), "demo", "references"))).toEqual(["stale.md"]);
    expect(await readdir(outDir())).toEqual(["demo"]); // no staging or backup dir left behind
  });
});
