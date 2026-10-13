import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT_DIR, SKILLS_OUTPUT_DIR } from "../src/config.js";

// GFM splits cells on every unescaped pipe — even inside backticks.
const cellCount = (line: string) => {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).length;
};

const markdownFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? markdownFiles(join(dir, e.name)) : e.name.endsWith(".md") ? [join(dir, e.name)] : [],
  );

const misalignedRows = (file: string): string[] => {
  const lines = readFileSync(file, "utf8").split("\n");
  const bad: string[] = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith("```")) inFence = !inFence;
    const isHeader =
      !inFence && lines[i].trim().startsWith("|") && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] ?? "");
    if (!isHeader) continue;
    const expected = cellCount(lines[i]);
    let j = i + 2;
    for (; j < lines.length && lines[j].trim().startsWith("|"); j++) {
      if (cellCount(lines[j]) !== expected) bad.push(`L${j + 1}: ${lines[j].trim().slice(0, 100)}`);
    }
    i = j - 1;
  }
  return bad;
};

describe("generated skill output", () => {
  for (const file of markdownFiles(SKILLS_OUTPUT_DIR)) {
    it(`tables are well-formed in ${relative(ROOT_DIR, file)}`, () => {
      expect(misalignedRows(file)).toEqual([]);
    });
  }
});
