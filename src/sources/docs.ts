import { fetchText } from "../utils/fetch.js";
import type { DocsSource } from "./types.js";
import { logger } from "../utils/logger.js";

/**
 * Extract a section from markdown by heading.
 * Returns everything from the matched heading to the next heading of same or higher level.
 */
function extractSection(markdown: string, selector: string): string {
  const headingMatch = selector.match(/^(#{1,6})\s+(.+)$/);
  if (!headingMatch) {
    throw new Error(`Invalid section selector: ${selector}. Must be a markdown heading like "## Heading"`);
  }

  const level = headingMatch[1].length;
  const title = headingMatch[2];
  const lines = markdown.split("\n");
  let startIdx = -1;
  let endIdx = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineHeading = line.match(/^(#{1,6})\s+(.+)$/);
    if (!lineHeading) continue;

    if (startIdx === -1) {
      if (lineHeading[2].trim() === title.trim() && lineHeading[1].length === level) {
        startIdx = i;
      }
    } else if (lineHeading[1].length <= level) {
      endIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    logger.warn(`Section "${selector}" not found in document`);
    return "";
  }

  return lines.slice(startIdx, endIdx).join("\n").trim();
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
