import { describe, it, expect } from "vitest";
import { parseYaml } from "../../src/utils/yaml.js";

describe("parseYaml", () => {
  it("parses simple key-value YAML", () => {
    const result = parseYaml<{ name: string }>("name: hello");
    expect(result).toEqual({ name: "hello" });
  });

  it("parses nested objects", () => {
    const yaml = `
parent:
  child: value
  num: 42
`;
    const result = parseYaml<{ parent: { child: string; num: number } }>(yaml);
    expect(result).toEqual({ parent: { child: "value", num: 42 } });
  });

  it("parses arrays", () => {
    const yaml = `
items:
  - one
  - two
  - three
`;
    const result = parseYaml<{ items: string[] }>(yaml);
    expect(result).toEqual({ items: ["one", "two", "three"] });
  });

  it("parses multiline strings with >", () => {
    const yaml = `
desc: >
  This is a long
  description.
`;
    const result = parseYaml<{ desc: string }>(yaml);
    expect(result.desc.trim()).toBe("This is a long description.");
  });

  it("parses multiline strings with |", () => {
    const yaml = `
desc: |
  line one
  line two
`;
    const result = parseYaml<{ desc: string }>(yaml);
    expect(result.desc).toContain("line one\nline two");
  });

  it("handles boolean values", () => {
    const result = parseYaml<{ flag: boolean }>("flag: true");
    expect(result.flag).toBe(true);
  });

  it("handles null values", () => {
    const result = parseYaml<{ value: null }>("value: null");
    expect(result.value).toBeNull();
  });

  it("parses complex sources.yaml structure", () => {
    const yaml = `
name: my-skill
description: A test skill.
sources:
  - type: static
    key: overview
    path: overview.md
  - type: cli
    key: commands
    command: "echo hello"
    format: json
metadata:
  author: test
  version: "1.0"
`;
    const result = parseYaml<{
      name: string;
      sources: Array<{ type: string; key: string }>;
      metadata: Record<string, string>;
    }>(yaml);
    expect(result.name).toBe("my-skill");
    expect(result.sources).toHaveLength(2);
    expect(result.sources[0].type).toBe("static");
    expect(result.sources[1].type).toBe("cli");
    expect(result.metadata.author).toBe("test");
  });

  it("throws for empty string", () => {
    expect(() => parseYaml("")).toThrow(/YAML parsed to null/);
  });

  it("throws for malformed YAML", () => {
    expect(() => parseYaml("key: [unbalanced")).toThrow();
  });
});
