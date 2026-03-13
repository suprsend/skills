import { fetchText } from "../utils/fetch.js";
import type { DocsSource } from "./types.js";
import { logger } from "../utils/logger.js";
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
  // <br /> tags
  result = result.replace(/<br\s*\/?>/g, "");

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

export async function resolveDocs(source: DocsSource): Promise<string> {
  const parts: string[] = [];

  for (const url of source.urls) {
    // Mintlify docs: try appending .md if the URL doesn't already end with it
    let fetchUrl = url;
    if (!fetchUrl.endsWith(".md") && !fetchUrl.endsWith(".mdx")) {
      fetchUrl = url + ".md";
    }

    try {
      logger.info(`Fetching docs: ${fetchUrl}`);
      let content = await fetchText(fetchUrl);

      if (source.selector) {
        content = extractSection(content, source.selector);
      }

      content = cleanMintlifyMarkdown(content);

      parts.push(content);
    } catch (err) {
      // If .md failed, try the original URL
      if (fetchUrl !== url) {
        logger.debug(`Retrying with original URL: ${url}`);
        try {
          let content = await fetchText(url);
          if (source.selector) {
            content = extractSection(content, source.selector);
          }
          content = cleanMintlifyMarkdown(content);
          parts.push(content);
        } catch (retryErr) {
          throw new Error(`Failed to fetch docs from ${url}: ${retryErr}`);
        }
      } else {
        throw err;
      }
    }
  }

  return parts.join("\n\n---\n\n");
}
