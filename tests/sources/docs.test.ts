import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveDocs, cleanMintlifyMarkdown } from "../../src/sources/docs.js";
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
    const result = await resolveDocs("test-skill", source);
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
      await resolveDocs("test-skill", source);
      expect(fetch).toHaveBeenCalledWith("https://docs.example.com/page.md", expect.anything());
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
      await resolveDocs("test-skill", source);
      expect(fetch).toHaveBeenCalledWith("https://docs.example.com/page.md", expect.anything());
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
      await resolveDocs("test-skill", source);
      expect(fetch).toHaveBeenCalledWith("https://docs.example.com/page.mdx", expect.anything());
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
      const result = await resolveDocs("test-skill", source);
      expect(result).toBe("original content");
      // First call with .md, second call with original
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        "https://docs.example.com/page.md",
        expect.anything(),
      );
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        "https://docs.example.com/page",
        expect.anything(),
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
      const result = await resolveDocs("test-skill", source);
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
      const result = await resolveDocs("test-skill", source);
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
      const result = await resolveDocs("test-skill", source);
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
      await expect(resolveDocs("test-skill", source)).rejects.toThrow("Invalid section selector");
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
      const result = await resolveDocs("test-skill", source);
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
      const result = await resolveDocs("test-skill", source);
      expect(result).toContain("Content A");
      expect(result).toContain("---");
      expect(result).toContain("Content B");
    });
  });

  describe("selector on retry path", () => {
    it("applies selector when falling back to original URL", async () => {
      const doc = [
        "# Title",
        "",
        "## Config",
        "",
        "Config content here.",
        "",
        "## Other",
        "",
        "Other stuff.",
      ].join("\n");

      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response("Not Found", { status: 404, statusText: "Not Found" }),
        )
        .mockResolvedValueOnce(new Response(doc, { status: 200 }));

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page"],
        selector: "## Config",
      };
      const result = await resolveDocs("test-skill", source);
      expect(result).toContain("## Config");
      expect(result).toContain("Config content here.");
      expect(result).not.toContain("## Other");
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
      await expect(resolveDocs("test-skill", source)).rejects.toThrow("HTTP 500");
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
      await expect(resolveDocs("test-skill", source)).rejects.toThrow();
    });
  });

  describe("cleanMintlifyMarkdown integration", () => {
    it("strips Mintlify boilerplate from fetched content", async () => {
      const rawDoc = [
        "> ## Documentation Index",
        "> Fetch the complete documentation index at: https://docs.suprsend.com/llms.txt",
        "> Use this file to discover all available pages before exploring further.",
        "",
        "# Delay",
        "",
        "> Learn about delay node.",
        "",
        "Content here.",
        "",
        "Built with [Mintlify](https://mintlify.com).",
      ].join("\n");

      vi.mocked(fetch).mockResolvedValue(
        new Response(rawDoc, { status: 200 }),
      );

      const source: DocsSource = {
        type: "docs",
        key: "doc",
        urls: ["https://docs.example.com/page.md"],
      };
      const result = await resolveDocs("test-skill", source);
      expect(result).not.toContain("Documentation Index");
      expect(result).not.toContain("Mintlify");
      expect(result).toContain("# Delay");
      expect(result).toContain("Content here.");
    });
  });
});

describe("cleanMintlifyMarkdown", () => {
  it("removes Documentation Index blockquote", () => {
    const input = [
      "> ## Documentation Index",
      "> Fetch the complete documentation index at: https://docs.suprsend.com/llms.txt",
      "> Use this file to discover all available pages before exploring further.",
      "",
      "# Actual Content",
    ].join("\n");
    const result = cleanMintlifyMarkdown(input);
    expect(result).not.toContain("Documentation Index");
    expect(result).toContain("# Actual Content");
  });

  it("removes Built with Mintlify footer", () => {
    const input = "Some content.\n\nBuilt with [Mintlify](https://mintlify.com).";
    const result = cleanMintlifyMarkdown(input);
    expect(result).not.toContain("Mintlify");
    expect(result).toContain("Some content.");
  });

  it("removes <img> tags", () => {
    const input = 'Content before.\n\n<img src="https://mintcdn.com/suprsend/image.png" alt="" width="800" height="600" />\n\nContent after.';
    const result = cleanMintlifyMarkdown(input);
    expect(result).not.toContain("<img");
    expect(result).toContain("Content before.");
    expect(result).toContain("Content after.");
  });

  it("converts <Warning> to blockquote", () => {
    const input = "<Warning>\n  List ID only supports a-z, 0-9.\n</Warning>";
    const result = cleanMintlifyMarkdown(input);
    expect(result).toContain("> **Warning:**");
    expect(result).toContain("List ID only supports a-z, 0-9.");
    expect(result).not.toContain("</Warning>");
  });

  it("converts <Note> to blockquote", () => {
    const input = "<Note>\n  Important information here.\n</Note>";
    const result = cleanMintlifyMarkdown(input);
    expect(result).toContain("> **Note:**");
    expect(result).not.toContain("</Note>");
  });

  it("converts <Accordion> to headings", () => {
    const input = '<AccordionGroup>\n  <Accordion title="Fixed">\n    Fixed delay content.\n  </Accordion>\n  <Accordion title="Dynamic">\n    Dynamic content.\n  </Accordion>\n</AccordionGroup>';
    const result = cleanMintlifyMarkdown(input);
    expect(result).toContain("### Fixed");
    expect(result).toContain("### Dynamic");
    expect(result).not.toContain("<AccordionGroup>");
    expect(result).not.toContain("<Accordion");
  });

  it("converts <Step> to bold", () => {
    const input = '<Steps>\n  <Step title="Open batch window">\n    Content.\n  </Step>\n</Steps>';
    const result = cleanMintlifyMarkdown(input);
    expect(result).toContain("**Open batch window**");
    expect(result).not.toContain("<Steps>");
    expect(result).not.toContain("<Step");
  });

  it("strips <CodeGroup> wrappers", () => {
    const input = "<CodeGroup>\n```json\n{}\n```\n</CodeGroup>";
    const result = cleanMintlifyMarkdown(input);
    expect(result).not.toContain("CodeGroup");
    expect(result).toContain("```json");
  });

  it("fixes over-escaped characters", () => {
    const input = "format: \\\\\\*\\\\\\*d \\\\\\*\\\\\\*h";
    const result = cleanMintlifyMarkdown(input);
    expect(result).not.toContain("\\\\\\*");
    // Over-escaped \\\* becomes * so \\\\\\*\\\\\\* becomes **
    expect(result).toContain("**d **h");
  });

  it("fixes single-escaped asterisks in duration patterns", () => {
    const input = "format: `*\\*d \\*\\*h \\*\\*m \\*\\*s`";
    const result = cleanMintlifyMarkdown(input);
    expect(result).toContain("`**d **h **m **s`");
  });

  it("fixes escaped brackets", () => {
    const input = 'values: \\\\\\["email", "sms"\\\\\\]';
    const result = cleanMintlifyMarkdown(input);
    expect(result).toContain('["email", "sms"]');
  });

  it("fixes escaped underscores", () => {
    const input = "workflow\\_slug and batch\\_key";
    const result = cleanMintlifyMarkdown(input);
    expect(result).toContain("workflow_slug and batch_key");
  });

  it("removes <br /> tags", () => {
    const input = "Line one.<br />\nLine two.";
    const result = cleanMintlifyMarkdown(input);
    expect(result).not.toContain("<br");
  });

  it("collapses excessive blank lines", () => {
    const input = "A\n\n\n\n\n\nB";
    const result = cleanMintlifyMarkdown(input);
    expect(result).toBe("A\n\n\nB");
  });

  it("handles content with no Mintlify artifacts", () => {
    const input = "# Clean Content\n\nJust plain markdown.";
    const result = cleanMintlifyMarkdown(input);
    expect(result).toBe(input);
  });

  it("strips <Frame> wrapper but keeps content", () => {
    const input = '<Frame caption="Example">\n  Some content inside frame.\n</Frame>';
    const result = cleanMintlifyMarkdown(input);
    expect(result).not.toContain("<Frame");
    expect(result).not.toContain("</Frame>");
    expect(result).toContain("Some content inside frame.");
  });

  it("converts <Check> to blockquote", () => {
    const input = "<Check>\n  ### Important\n  Check content.\n</Check>";
    const result = cleanMintlifyMarkdown(input);
    expect(result).toContain("> **Note:**");
    expect(result).not.toContain("</Check>");
  });
});
