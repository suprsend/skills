import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchText, fetchJson } from "../../src/utils/fetch.js";

describe("fetchText", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns response text on success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("hello world", { status: 200 }),
    );
    const result = await fetchText("https://example.com/doc.md");
    expect(result).toBe("hello world");
    expect(fetch).toHaveBeenCalledWith("https://example.com/doc.md", expect.anything());
  });

  it("throws on HTTP 404", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("Not Found", { status: 404, statusText: "Not Found" }),
    );
    await expect(fetchText("https://example.com/missing")).rejects.toThrow(
      "HTTP 404",
    );
  });

  it("throws on HTTP 500", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("Error", { status: 500, statusText: "Internal Server Error" }),
    );
    await expect(fetchText("https://example.com/error")).rejects.toThrow(
      "HTTP 500",
    );
  });

  it("includes URL in error message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("", { status: 403, statusText: "Forbidden" }),
    );
    await expect(fetchText("https://example.com/secret")).rejects.toThrow(
      "https://example.com/secret",
    );
  });
});

describe("fetchJson", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on success", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ key: "value" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const result = await fetchJson<{ key: string }>(
      "https://example.com/data.json",
    );
    expect(result).toEqual({ key: "value" });
  });

  it("returns parsed JSON array", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([1, 2, 3]), { status: 200 }),
    );
    const result = await fetchJson<number[]>("https://example.com/arr.json");
    expect(result).toEqual([1, 2, 3]);
  });

  it("throws on HTTP error", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("", { status: 401, statusText: "Unauthorized" }),
    );
    await expect(
      fetchJson("https://example.com/protected"),
    ).rejects.toThrow("HTTP 401");
  });

  it("throws on invalid JSON response body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("not json", { status: 200 }),
    );
    await expect(
      fetchJson("https://example.com/bad.json"),
    ).rejects.toThrow();
  });
});

describe("URL validation", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects file:// URLs", async () => {
    await expect(fetchText("file:///etc/passwd")).rejects.toThrow(
      /unsupported url scheme/i,
    );
  });

  it("rejects ftp:// URLs", async () => {
    await expect(fetchJson("ftp://example.com/data")).rejects.toThrow(
      /unsupported url scheme/i,
    );
  });

  it("rejects invalid URLs", async () => {
    await expect(fetchText("not-a-url")).rejects.toThrow(/invalid url/i);
  });
});

describe("GitHub API auth", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const headersOf = () => new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers);

  it("sends GITHUB_TOKEN to api.github.com", async () => {
    vi.stubEnv("GITHUB_TOKEN", "t0ken");
    await fetchJson("https://api.github.com/repos/o/r/contents/x");
    expect(headersOf().get("authorization")).toBe("Bearer t0ken");
  });

  it("never sends the token to other hosts", async () => {
    vi.stubEnv("GITHUB_TOKEN", "t0ken");
    await fetchText("https://raw.githubusercontent.com/o/r/main/x.md");
    expect(headersOf().get("authorization")).toBeNull();
  });

  it("sends no auth header when GITHUB_TOKEN is unset", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    await fetchJson("https://api.github.com/repos/o/r/contents/x");
    expect(headersOf().get("authorization")).toBeNull();
  });
});
