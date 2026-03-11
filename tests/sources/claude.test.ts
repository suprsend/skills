import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ClaudeSource } from "../../src/sources/types.js";

// Mock the cache module
vi.mock("../../src/cache/claude-cache.js", () => ({
  getCached: vi.fn(),
  setCache: vi.fn(),
}));

// Mock the config module
vi.mock("../../src/config.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/config.js")>();
  return {
    ...original,
    ANTHROPIC_API_KEY: "test-key-123",
    DEFAULT_MODEL: "claude-sonnet-4-20250514",
    DEFAULT_MAX_TOKENS: 4000,
  };
});

// Mock Anthropic SDK
const mockCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

import { resolveClaude } from "../../src/sources/claude.js";
import { getCached, setCache } from "../../src/cache/claude-cache.js";

describe("resolveClaude", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(setCache).mockResolvedValue(undefined);
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Generated content" }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("returns cached response when available", async () => {
    vi.mocked(getCached).mockResolvedValue("cached response");

    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
    };
    const result = await resolveClaude(source, "Generate something", true);
    expect(result).toBe("cached response");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("calls API when cache misses", async () => {
    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
    };
    const result = await resolveClaude(source, "Generate something", true);
    expect(result).toBe("Generated content");
    expect(mockCreate).toHaveBeenCalled();
  });

  it("caches API response after calling", async () => {
    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
    };
    await resolveClaude(source, "Generate something", true);
    expect(setCache).toHaveBeenCalledWith(
      "claude-sonnet-4-20250514",
      "Generate something",
      "Generated content",
    );
  });

  it("skips cache read and write when useCache is false", async () => {
    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
    };
    await resolveClaude(source, "Generate something", false);
    expect(getCached).not.toHaveBeenCalled();
    expect(setCache).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalled();
  });

  it("uses default model when not specified", async () => {
    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
    };
    await resolveClaude(source, "Generate something", true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-sonnet-4-20250514" }),
    );
  });

  it("uses custom model when specified", async () => {
    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
      model: "claude-opus-4-20250514",
    };
    await resolveClaude(source, "Generate something", true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "claude-opus-4-20250514" }),
    );
  });

  it("uses default max_tokens when not specified", async () => {
    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
    };
    await resolveClaude(source, "Generate something", true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 4000 }),
    );
  });

  it("uses custom max_tokens when specified", async () => {
    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
      max_tokens: 8000,
    };
    await resolveClaude(source, "Generate something", true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 8000 }),
    );
  });

  it("sends interpolated prompt as user message", async () => {
    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "original prompt",
    };
    await resolveClaude(source, "interpolated prompt", true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "interpolated prompt" }],
      }),
    );
  });

  it("returns empty string when response has no text block", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "tool_use", id: "123", name: "test", input: {} }],
    });

    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
    };
    const result = await resolveClaude(source, "Generate something", true);
    expect(result).toBe("");
  });

  it("returns empty string when response content is empty", async () => {
    mockCreate.mockResolvedValue({ content: [] });

    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
    };
    const result = await resolveClaude(source, "Generate something", true);
    expect(result).toBe("");
  });

  it("warns when response is empty", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockCreate.mockResolvedValue({ content: [] });

    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
    };
    await resolveClaude(source, "Generate something", true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[WARN]"),
      expect.stringContaining('empty response for key "test"'),
    );
    warnSpy.mockRestore();
  });

  it("propagates API errors", async () => {
    mockCreate.mockRejectedValue(new Error("API rate limit exceeded"));

    const source: ClaudeSource = {
      type: "claude",
      key: "test",
      prompt: "Generate something",
    };
    await expect(
      resolveClaude(source, "Generate something", true),
    ).rejects.toThrow("API rate limit exceeded");
  });
});
