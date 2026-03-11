import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveDocs } from "../../src/sources/docs.js";
import type { DocsSource } from "../../src/sources/types.js";

describe("resolveDocs", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches content from a URL", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("# Hello\n\nContent here.", { status: 200 }),
    );

    const source: DocsSource = {
      type: "docs",
      key: "doc",
      urls: ["https://docs.example.com/page.md"],
    };
    const result = await resolveDocs(source);
    expect(result).toBe("# Hello\n\nContent here.");
  });

  describe("URL suffix handling", () => {
    it("appends .md to URLs without extension", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response("content", { status: 200 }),
      );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page"],
      };
      await resolveDocs(source);
      expect(fetch).toHaveBeenCalledWith("https://docs.example.com/page.md");
    });

    it("does not append .md if URL already ends with .md", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response("content", { status: 200 }),
      );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page.md"],
      };
      await resolveDocs(source);
      expect(fetch).toHaveBeenCalledWith("https://docs.example.com/page.md");
    });

    it("does not append .md if URL already ends with .mdx", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response("content", { status: 200 }),
      );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page.mdx"],
      };
      await resolveDocs(source);
      expect(fetch).toHaveBeenCalledWith("https://docs.example.com/page.mdx");
    });

    it("falls back to original URL if .md append fails", async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response("Not Found", { status: 404, statusText: "Not Found" }),
        )
        .mockResolvedValueOnce(
          new Response("original content", { status: 200 }),
        );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page"],
      };
      const result = await resolveDocs(source);
      expect(result).toBe("original content");
      // First call with .md, second call with original
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        "https://docs.example.com/page.md",
      );
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        "https://docs.example.com/page",
      );
    });
  });

  describe("section extraction", () => {
    const fullDoc = [
      "# Title",
      "",
      "Intro text.",
      "",
      "## Configuration",
      "",
      "Config content line 1.",
      "Config content line 2.",
      "",
      "## Deployment",
      "",
      "Deploy content.",
    ].join("\n");

    it("extracts a section by heading", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(fullDoc, { status: 200 }),
      );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page.md"],
        selector: "## Configuration",
      };
      const result = await resolveDocs(source);
      expect(result).toContain("## Configuration");
      expect(result).toContain("Config content line 1.");
      expect(result).toContain("Config content line 2.");
      expect(result).not.toContain("## Deployment");
      expect(result).not.toContain("Deploy content.");
    });

    it("extracts last section (no following heading)", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(fullDoc, { status: 200 }),
      );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page.md"],
        selector: "## Deployment",
      };
      const result = await resolveDocs(source);
      expect(result).toContain("## Deployment");
      expect(result).toContain("Deploy content.");
    });

    it("returns empty string when section heading not found", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(fullDoc, { status: 200 }),
      );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page.md"],
        selector: "## Nonexistent",
      };
      const result = await resolveDocs(source);
      expect(result).toBe("");
    });

    it("throws on invalid selector format", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(fullDoc, { status: 200 }),
      );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page.md"],
        selector: "not a heading",
      };
      await expect(resolveDocs(source)).rejects.toThrow("Invalid section selector");
    });

    it("respects heading level boundaries", async () => {
      const doc = [
        "# Top",
        "## Section A",
        "### Subsection",
        "sub content",
        "## Section B",
        "b content",
      ].join("\n");
      vi.mocked(fetch).mockResolvedValue(
        new Response(doc, { status: 200 }),
      );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page.md"],
        selector: "## Section A",
      };
      const result = await resolveDocs(source);
      expect(result).toContain("### Subsection");
      expect(result).toContain("sub content");
      expect(result).not.toContain("Section B");
    });
  });

  describe("multiple URLs", () => {
    it("joins multiple URL contents with separator", async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(new Response("Content A", { status: 200 }))
        .mockResolvedValueOnce(new Response("Content B", { status: 200 }));

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: [
          "https://docs.example.com/a.md",
          "https://docs.example.com/b.md",
        ],
      };
      const result = await resolveDocs(source);
      expect(result).toContain("Content A");
      expect(result).toContain("---");
      expect(result).toContain("Content B");
    });
  });

  describe("error handling", () => {
    it("throws when URL fetch fails with no fallback", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response("", { status: 500, statusText: "Server Error" }),
      );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page.md"],
      };
      await expect(resolveDocs(source)).rejects.toThrow("HTTP 500");
    });

    it("throws when both .md and original URL fail", async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response("", { status: 404, statusText: "Not Found" }),
        )
        .mockResolvedValueOnce(
          new Response("", { status: 404, statusText: "Not Found" }),
        );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page"],
      };
      await expect(resolveDocs(source)).rejects.toThrow();
    });
  });
});
