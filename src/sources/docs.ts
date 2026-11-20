import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fetchText } from "../utils/fetch.js";
import type { DocsSource } from "./types.js";
import { SKILLS_SRC_DIR } from "../config.js";
import { logger } from "../utils/logger.js";
import { assertWithinDir } from "../utils/path-safety.js";
import { extractSection as extractSectionUtil } from "../utils/markdown.js";

function extractSection(markdown: string, selector: string): string {
  const headingMatch = selector.match(/^(#{1,6})\s+(.+)$/);
  if (!headingMatch) {
    throw new Error(`Invalid section selector: ${selector}. Must be a markdown heading like "## Heading"`);
  }

  const result = extractSectionUtil(markdown, selector);
  if (result === null) {
    logger.warn(`Section "${selector}" not found in document`);
    return "";
  }
  return result;
}

/**
 * Mintlify's markdown export renders an accordion as a blockquote whose first line is
 * `> [accordion] Title`. Turn the title into a heading and unquote the body, so the
 * content reads as a normal section.
 */
function unquoteAccordions(content: string): string {
  const out: string[] = [];
  let inAccordion = false;
  for (const line of content.split("\n")) {
    const title = line.match(/^>[ \t]?\[accordion\][ \t]*(.*)$/);
    if (title) {
      out.push(`### ${title[1]}`);
      inAccordion = true;
    } else if (inAccordion && line.startsWith(">")) {
      out.push(line.replace(/^>[ \t]?/, ""));
    } else {
      inAccordion = false;
      out.push(line);
    }
  }
  return out.join("\n");
}

/**
 * Clean up raw Mintlify markdown for agent consumption.
 * Removes boilerplate, images, proprietary components, and escape artifacts.
 */
export function cleanMintlifyMarkdown(content: string): string {
  let result = content;

  // Remove "Documentation Index" blockquote boilerplate
  // Matches the > ## Documentation Index block (2-3 lines starting with >)
  result = result.replace(
    /^>\s*##\s*Documentation Index\n(?:>\s*.*\n)*/gm,
    "",
  );

  // Remove "Built with Mintlify" lines
  result = result.replace(/^\s*Built with \[Mintlify\]\(https?:\/\/mintlify\.com\)\.?\s*$/gm, "");

  // Remove the "built and hosted on Mintlify" footer line
  result = result.replace(/^\s*This documentation is built and hosted on \[Mintlify\]\([^)]*\)[^\n]*$/gm, "");

  // Remove the auto-generated trailing "Related topics" link list
  result = result.replace(/\n## Related topics[ \t]*\n(?:\s*- \[[^\n]*\]\([^\n]*\)[ \t]*\n?)+\s*$/, "\n");

  // Blockquote-style components from Mintlify's markdown export
  // `> [accordion] Title` + quoted body → `### Title` + unquoted body
  result = unquoteAccordions(result);
  // `> [!NOTE]` / `> [!TIP]` / `> [!WARNING]` → `> **Note:**` (nested quotes keep their depth)
  result = result.replace(
    /^((?:>[ \t]?)+)\[!([A-Za-z]+)\][ \t]*$/gm,
    (_m, quote: string, kind: string) => `${quote}**${kind[0].toUpperCase()}${kind.slice(1).toLowerCase()}:**`,
  );
  // `> [card] Title` → `> **Title**`
  result = result.replace(/^((?:>[ \t]?)+)\[card\][ \t]*(.+)$/gm, "$1**$2**");

  // Remove standalone markdown images (agents can't render images)
  result = result.replace(/^(?:>[ \t]?)*!\[[^\]\n]*\]\([^)\n]*\)[ \t]*$/gm, "");

  // Remove <img> tags (agents can't render images)
  result = result.replace(/^\s*<img\s+[^>]*\/?\s*>\s*$/gm, "");

  // Convert Mintlify components to standard markdown equivalents
  // <Warning> → > **Warning:**
  result = result.replace(/<Warning>/g, "> **Warning:**");
  result = result.replace(/<\/Warning>/g, "");
  // <Note> → > **Note:**
  result = result.replace(/<Note>/g, "> **Note:**");
  result = result.replace(/<\/Note>/g, "");
  // <Check> → > **Note:**
  result = result.replace(/<Check>/g, "> **Note:**");
  result = result.replace(/<\/Check>/g, "");

  // Strip layout-only components (no semantic meaning for agents)
  result = result.replace(/<\/?(?:AccordionGroup|Frame|Steps)(?:\s[^>]*)?>/g, "");
  // <Accordion title="..."> → ### ...
  result = result.replace(/<Accordion\s+title="([^"]*)"[^>]*>/g, "### $1");
  result = result.replace(/<\/Accordion>/g, "");
  // <Step title="..."> → **Step: ...**
  result = result.replace(/<Step\s+title="([^"]*)"[^>]*>/g, "**$1**");
  result = result.replace(/<\/Step>/g, "");
  // <CodeGroup> → just remove wrapper
  result = result.replace(/<\/?CodeGroup>/g, "");
  // <br /> tags — kept inside inline code; a space is left where removal would join two tokens
  result = result.replace(/(`[^`\n]*`)|<br\s*\/?>/g, (match, code: string | undefined, offset: number, str: string) => {
    if (code) return code;
    const joinsTokens = /\S/.test(str[offset - 1] ?? "") && /\S/.test(str[offset + match.length] ?? "");
    return joinsTokens ? " " : "";
  });

  // Fix escaped character artifacts from Mintlify rendering
  // Over-escaped backslash sequences: \\\* → *
  result = result.replace(/\\{2,}\*/g, "*");
  // Over-escaped brackets: \\\[ → [, \\\] → ]
  result = result.replace(/\\{2,}\[/g, "[");
  result = result.replace(/\\{2,}\]/g, "]");
  // Single escaped asterisks from Mintlify: \* → *
  result = result.replace(/\\\*/g, "*");
  // Single escaped underscores from Mintlify: \_ → _
  result = result.replace(/\\_/g, "_");

  // Collapse 3+ consecutive blank lines into 2
  result = result.replace(/\n{4,}/g, "\n\n\n");

  // Trim leading/trailing whitespace
  result = result.trim();

  return result;
}

async function readOverrideFile(
  skillName: string,
  relPath: string,
  key: string,
): Promise<string> {
  const baseDir = resolve(SKILLS_SRC_DIR, skillName);
  const filePath = resolve(baseDir, relPath);
  assertWithinDir(filePath, baseDir, `docs "${key}" override path`);
  return readFile(filePath, "utf-8");
}

async function resolveReplacementStrings(
  skillName: string,
  replacements: DocsSource["replacements"],
  key: string,
): Promise<{ find: string; replace: string }[]> {
  if (!replacements?.length) return [];
  const resolved: { find: string; replace: string }[] = [];
  for (const [i, r] of replacements.entries()) {
    const hasFind = typeof r.find === "string";
    const hasFindFile = typeof r.findFile === "string";
    if (hasFind === hasFindFile) {
      throw new Error(
        `docs source "${key}" replacement #${i + 1}: provide exactly one of \`find\` or \`findFile\`.`,
      );
    }
    const hasReplace = typeof r.replace === "string";
    const hasReplaceFile = typeof r.replaceFile === "string";
    if (hasReplace === hasReplaceFile) {
      throw new Error(
        `docs source "${key}" replacement #${i + 1}: provide exactly one of \`replace\` or \`replaceFile\`.`,
      );
    }
    const find = hasFind ? r.find! : await readOverrideFile(skillName, r.findFile!, key);
    const replace = hasReplace ? r.replace! : await readOverrideFile(skillName, r.replaceFile!, key);
    resolved.push({ find, replace });
  }
  return resolved;
}

function applyReplacements(
  content: string,
  replacements: { find: string; replace: string }[],
  key: string,
): string {
  if (!replacements.length) return content;
  let result = content;
  for (const [i, { find, replace }] of replacements.entries()) {
    const idx = result.indexOf(find);
    if (idx === -1) {
      throw new Error(
        `docs source "${key}" replacement #${i + 1} did not match — upstream content may have changed. Looking for:\n${find}`,
      );
    }
    if (result.indexOf(find, idx + find.length) !== -1) {
      throw new Error(
        `docs source "${key}" replacement #${i + 1} matched more than once — make the \`find\` string more specific.`,
      );
    }
    result = result.slice(0, idx) + replace + result.slice(idx + find.length);
  }
  return result;
}

export async function resolveDocs(skillName: string, source: DocsSource): Promise<string> {
  const parts: string[] = [];
  const replacements = await resolveReplacementStrings(skillName, source.replacements, source.key);

  for (const url of source.urls) {
    // Mintlify docs: try appending .md if the URL doesn't already end with it
    let fetchUrl = url;
    if (!fetchUrl.endsWith(".md") && !fetchUrl.endsWith(".mdx")) {
      fetchUrl = url + ".md";
    }

    // Only a failed fetch falls back to the original URL. A selector or replacement
    // error on fetched content is reported as-is, not masked by a retry against HTML.
    let content: string;
    try {
      logger.info(`Fetching docs: ${fetchUrl}`);
      content = await fetchText(fetchUrl);
    } catch (err) {
      if (fetchUrl === url) throw err;
      logger.debug(`Retrying with original URL: ${url}`);
      try {
        content = await fetchText(url);
      } catch (retryErr) {
        throw new Error(`Failed to fetch docs from ${url}: ${retryErr}`);
      }
    }

    if (source.selector) {
      content = extractSection(content, source.selector);
    }
    content = cleanMintlifyMarkdown(content);
    content = applyReplacements(content, replacements, source.key);
    parts.push(content);
  }

  return parts.join("\n\n---\n\n");
}
