import { describe, it, expect, beforeAll } from "vitest";
import Handlebars from "handlebars";
import { registerHelpers } from "../../src/render/helpers.js";

// Register helpers once
beforeAll(() => {
  registerHelpers(Handlebars);
});

function render(template: string, context: Record<string, unknown> = {}): string {
  return Handlebars.compile(template, { noEscape: true })(context);
}

describe("Handlebars helpers", () => {
  describe("json", () => {
    it("renders an object as formatted JSON", () => {
      const result = render("{{json data}}", { data: { a: 1, b: "two" } });
      expect(result).toBe(JSON.stringify({ a: 1, b: "two" }, null, 2));
    });

    it("renders an array as formatted JSON", () => {
      const result = render("{{json items}}", { items: [1, 2, 3] });
      expect(result).toBe(JSON.stringify([1, 2, 3], null, 2));
    });

    it("renders null", () => {
      const result = render("{{json data}}", { data: null });
      expect(result).toBe("null");
    });

    it("renders a string as JSON", () => {
      const result = render("{{json data}}", { data: "hello" });
      expect(result).toBe('"hello"');
    });

    it("renders nested objects", () => {
      const data = { a: { b: { c: 1 } } };
      const result = render("{{json data}}", { data });
      expect(JSON.parse(result)).toEqual(data);
    });
  });

  describe("schema-table", () => {
    it("generates a markdown table from schema properties", () => {
      const schema = {
        properties: {
          name: { type: "string", description: "The name" },
          age: { type: "integer", description: "User age" },
        },
        required: ["name"],
      };
      const result = render("{{schema-table schema}}", { schema });
      expect(result).toContain("| Property | Type | Required | Description |");
      expect(result).toContain("| name | string | Yes | The name |");
      expect(result).toContain("| age | integer | No | User age |");
    });

    it("returns empty string when schema has no properties", () => {
      const result = render("{{schema-table schema}}", { schema: {} });
      expect(result).toBe("");
    });

    it("returns empty string for null schema", () => {
      const result = render("{{schema-table schema}}", { schema: null });
      expect(result).toBe("");
    });

    it("handles missing required array (all fields optional)", () => {
      const schema = {
        properties: {
          name: { type: "string", description: "A name" },
        },
      };
      const result = render("{{schema-table schema}}", { schema });
      expect(result).toContain("| name | string | No | A name |");
    });

    it("uses 'any' when type is missing", () => {
      const schema = {
        properties: {
          data: { description: "Some data" },
        },
      };
      const result = render("{{schema-table schema}}", { schema });
      expect(result).toContain("| data | any | No | Some data |");
    });

    it("handles missing description", () => {
      const schema = {
        properties: {
          name: { type: "string" },
        },
      };
      const result = render("{{schema-table schema}}", { schema });
      expect(result).toContain("| name | string | No |  |");
    });

    it("escapes pipe characters in description", () => {
      const schema = {
        properties: {
          mode: { type: "string", description: "a | b | c" },
        },
      };
      const result = render("{{schema-table schema}}", { schema });
      expect(result).toContain("a \\| b \\| c");
    });

    it("escapes newlines in description", () => {
      const schema = {
        properties: {
          info: { type: "string", description: "line one\nline two" },
        },
      };
      const result = render("{{schema-table schema}}", { schema });
      // The description column should have the newline replaced with a space
      expect(result).toContain("line one line two");
      // The row for "info" should be on a single line (no newline within the row itself)
      const infoRow = result.split("\n").find((l) => l.includes("| info |"));
      expect(infoRow).toBeDefined();
      expect(infoRow).toContain("line one line two");
    });
  });

  describe("schema-enum", () => {
    it("generates a markdown list from enum values", () => {
      const result = render("{{schema-enum values}}", {
        values: ["one", "two", "three"],
      });
      expect(result).toBe("- `one`\n- `two`\n- `three`");
    });

    it("handles single-item enum", () => {
      const result = render("{{schema-enum values}}", { values: ["only"] });
      expect(result).toBe("- `only`");
    });

    it("returns empty string for non-array input", () => {
      const result = render("{{schema-enum values}}", { values: "not array" });
      expect(result).toBe("");
    });

    it("returns empty string for undefined", () => {
      const result = render("{{schema-enum values}}", {});
      expect(result).toBe("");
    });

    it("handles empty array", () => {
      const result = render("{{schema-enum values}}", { values: [] });
      expect(result).toBe("");
    });
  });

  describe("section", () => {
    const markdown = [
      "# Title",
      "",
      "Intro text.",
      "",
      "## Section A",
      "",
      "Section A content.",
      "",
      "### Subsection",
      "",
      "Sub content.",
      "",
      "## Section B",
      "",
      "Section B content.",
    ].join("\n");

    it("extracts a section by heading", () => {
      const result = render('{{section doc "## Section A"}}', { doc: markdown });
      expect(result).toContain("## Section A");
      expect(result).toContain("Section A content.");
      expect(result).toContain("### Subsection");
      expect(result).not.toContain("## Section B");
    });

    it("extracts last section (no following heading)", () => {
      const result = render('{{section doc "## Section B"}}', { doc: markdown });
      expect(result).toContain("## Section B");
      expect(result).toContain("Section B content.");
    });

    it("includes lower-level headings within section", () => {
      const result = render('{{section doc "## Section A"}}', { doc: markdown });
      expect(result).toContain("### Subsection");
      expect(result).toContain("Sub content.");
    });

    it("returns empty string when heading not found", () => {
      const result = render('{{section doc "## Nonexistent"}}', {
        doc: markdown,
      });
      expect(result).toBe("");
    });

    it("returns empty string for non-string input", () => {
      const result = render('{{section doc "## Test"}}', { doc: 42 });
      expect(result).toBe("");
    });

    it("returns empty string for invalid heading format", () => {
      const result = render('{{section doc "not a heading"}}', {
        doc: markdown,
      });
      expect(result).toBe("");
    });
  });

  describe("trim", () => {
    it("strips leading and trailing whitespace", () => {
      const result = render("{{trim text}}", { text: "  hello  " });
      expect(result).toBe("hello");
    });

    it("strips newlines", () => {
      const result = render("{{trim text}}", { text: "\n\nhello\n\n" });
      expect(result).toBe("hello");
    });

    it("handles already trimmed text", () => {
      const result = render("{{trim text}}", { text: "clean" });
      expect(result).toBe("clean");
    });

    it("returns empty string for non-string input", () => {
      const result = render("{{trim text}}", { text: 42 });
      expect(result).toBe("");
    });

    it("returns empty string for undefined", () => {
      const result = render("{{trim text}}", {});
      expect(result).toBe("");
    });
  });

  describe("codeblock", () => {
    it("wraps content in a fenced code block with language", () => {
      const result = render('{{codeblock code "json"}}', {
        code: '{"key": "value"}',
      });
      expect(result).toBe('```json\n{"key": "value"}\n```');
    });

    it("wraps content without language tag", () => {
      const result = render("{{codeblock code}}", { code: "some code" });
      expect(result).toBe("```\nsome code\n```");
    });

    it("stringifies object input as JSON", () => {
      const result = render('{{codeblock data "json"}}', {
        data: { a: 1 },
      });
      expect(result).toContain("```json");
      expect(result).toContain('"a": 1');
      expect(result).toContain("```");
    });

    it("handles multiline content", () => {
      const result = render('{{codeblock code "bash"}}', {
        code: "line1\nline2\nline3",
      });
      expect(result).toBe("```bash\nline1\nline2\nline3\n```");
    });
  });

  describe("ifEqual", () => {
    it("renders fn block when values are equal", () => {
      const result = render(
        '{{#ifEqual status "active"}}YES{{/ifEqual}}',
        { status: "active" },
      );
      expect(result).toBe("YES");
    });

    it("renders inverse block when values differ", () => {
      const result = render(
        '{{#ifEqual status "active"}}YES{{else}}NO{{/ifEqual}}',
        { status: "inactive" },
      );
      expect(result).toBe("NO");
    });

    it("renders empty when values differ and no inverse", () => {
      const result = render(
        '{{#ifEqual status "active"}}YES{{/ifEqual}}',
        { status: "inactive" },
      );
      expect(result).toBe("");
    });

    it("compares numbers", () => {
      const result = render(
        "{{#ifEqual count 3}}three{{/ifEqual}}",
        { count: 3 },
      );
      expect(result).toBe("three");
    });

    it("uses strict equality", () => {
      // "3" !== 3
      const result = render(
        "{{#ifEqual count 3}}match{{else}}no{{/ifEqual}}",
        { count: "3" },
      );
      expect(result).toBe("no");
    });
  });

  describe("each-sorted", () => {
    it("iterates object keys alphabetically", () => {
      const result = render(
        "{{#each-sorted obj}}{{key}}:{{value}},{{/each-sorted}}",
        { obj: { c: 3, a: 1, b: 2 } },
      );
      expect(result).toBe("a:1,b:2,c:3,");
    });

    it("returns empty for non-object input", () => {
      const result = render(
        "{{#each-sorted obj}}{{key}}{{/each-sorted}}",
        { obj: "string" },
      );
      expect(result).toBe("");
    });

    it("returns empty for null input", () => {
      const result = render(
        "{{#each-sorted obj}}{{key}}{{/each-sorted}}",
        { obj: null },
      );
      expect(result).toBe("");
    });

    it("handles single-key object", () => {
      const result = render(
        "{{#each-sorted obj}}{{key}}={{value}}{{/each-sorted}}",
        { obj: { only: "one" } },
      );
      expect(result).toBe("only=one");
    });

    it("handles empty object", () => {
      const result = render(
        "{{#each-sorted obj}}{{key}}{{/each-sorted}}",
        { obj: {} },
      );
      expect(result).toBe("");
    });
  });

  describe("ref-link", () => {
    it("generates a link to references/ with label", () => {
      const result = render('{{ref-link "guide.md" "The Guide"}}', {});
      expect(result).toBe("[The Guide](references/guide.md)");
    });

    it("uses filename as label when label is not a string", () => {
      // When only filename is provided (label gets the options hash)
      const result = render('{{ref-link "guide.md"}}', {});
      expect(result).toBe("[guide.md](references/guide.md)");
    });
  });

  describe("truncate", () => {
    it("truncates text longer than limit", () => {
      const result = render("{{truncate text 10}}", {
        text: "This is a long string that should be truncated",
      });
      expect(result).toBe("This is a ...");
      expect(result).toHaveLength(13); // 10 + "..."
    });

    it("keeps text shorter than limit unchanged", () => {
      const result = render("{{truncate text 100}}", { text: "short" });
      expect(result).toBe("short");
    });

    it("keeps text exactly at limit unchanged", () => {
      const result = render("{{truncate text 5}}", { text: "exact" });
      expect(result).toBe("exact");
    });

    it("returns empty string for non-string input", () => {
      const result = render("{{truncate text 10}}", { text: 42 });
      expect(result).toBe("");
    });

    it("returns empty string for undefined input", () => {
      const result = render("{{truncate text 10}}", {});
      expect(result).toBe("");
    });

    it("defaults to 500 char limit when length not a number", () => {
      const shortText = "a".repeat(400);
      const result = render("{{truncate text}}", { text: shortText });
      expect(result).toBe(shortText);

      const longText = "a".repeat(600);
      const result2 = render("{{truncate text}}", { text: longText });
      expect(result2).toBe("a".repeat(500) + "...");
    });
  });
});
