import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";

// We need to mock the CACHE_DIR to use a temp directory
let tempDir: string;

vi.mock("../../src/config.js", async () => {
  // Create the temp dir eagerly so it's available before tests
  const { mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = await mkdtemp(join(tmpdir(), "claude-cache-test-"));
  // Store in a module-level variable via global
  (globalThis as Record<string, unknown>).__testCacheDir = dir;
  return {
    CACHE_DIR: dir,
  };
});

import { getCached, setCache } from "../../src/cache/claude-cache.js";

describe("claude-cache", () => {
  beforeEach(async () => {
    tempDir = (globalThis as Record<string, unknown>).__testCacheDir as string;
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function expectedKey(model: string, prompt: string): string {
    return createHash("sha256").update(`${model}:${prompt}`).digest("hex");
  }

  describe("getCached", () => {
    it("returns null on cache miss (file not found)", async () => {
      const result = await getCached("model-x", "unique prompt that doesnt exist");
      expect(result).toBeNull();
    });

    it("returns cached response on hit", async () => {
      const model = "test-model";
      const prompt = "cached prompt";
      const key = expectedKey(model, prompt);
      const entry = {
        model,
        promptHash: key,
        response: "cached response text",
        createdAt: new Date().toISOString(),
      };
      await writeFile(
        resolve(tempDir, `${key}.json`),
        JSON.stringify(entry),
      );

      const result = await getCached(model, prompt);
      expect(result).toBe("cached response text");
    });

    it("returns null if cache file contains invalid JSON", async () => {
      const model = "test-model";
      const prompt = "bad json prompt";
      const key = expectedKey(model, prompt);
      await writeFile(resolve(tempDir, `${key}.json`), "not json");

      const result = await getCached(model, prompt);
      expect(result).toBeNull();
    });
  });

  describe("setCache", () => {
    it("writes cache file with correct structure", async () => {
      const model = "test-model";
      const prompt = "new prompt to cache";
      const response = "new response";

      await setCache(model, prompt, response);

      const key = expectedKey(model, prompt);
      const raw = await readFile(resolve(tempDir, `${key}.json`), "utf-8");
      const entry = JSON.parse(raw);

      expect(entry.model).toBe(model);
      expect(entry.promptHash).toBe(key);
      expect(entry.response).toBe(response);
      expect(entry.createdAt).toBeDefined();
      // Verify createdAt is a valid ISO date
      expect(new Date(entry.createdAt).toISOString()).toBe(entry.createdAt);
    });

    it("cache key is sha256(model:prompt)", async () => {
      const model = "m1";
      const prompt = "p1";
      await setCache(model, prompt, "resp");

      const expected = createHash("sha256").update("m1:p1").digest("hex");
      const raw = await readFile(resolve(tempDir, `${expected}.json`), "utf-8");
      expect(JSON.parse(raw).response).toBe("resp");
    });

    it("different prompts produce different cache keys", async () => {
      await setCache("model", "prompt-a", "response-a");
      await setCache("model", "prompt-b", "response-b");

      const resultA = await getCached("model", "prompt-a");
      const resultB = await getCached("model", "prompt-b");

      expect(resultA).toBe("response-a");
      expect(resultB).toBe("response-b");
    });

    it("different models produce different cache keys", async () => {
      await setCache("model-1", "same-prompt", "response-1");
      await setCache("model-2", "same-prompt", "response-2");

      const result1 = await getCached("model-1", "same-prompt");
      const result2 = await getCached("model-2", "same-prompt");

      expect(result1).toBe("response-1");
      expect(result2).toBe("response-2");
    });

    it("overwrites existing cache entry", async () => {
      await setCache("model", "prompt", "old-response");
      await setCache("model", "prompt", "new-response");

      const result = await getCached("model", "prompt");
      expect(result).toBe("new-response");
    });
  });
});
