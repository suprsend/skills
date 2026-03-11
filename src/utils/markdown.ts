/**
 * Extract a section from markdown by heading.
 * Returns everything from the matched heading to the next heading of same or higher level.
 */
export function extractSection(markdown: string, selector: string): string | null {
  const headingMatch = selector.match(/^(#{1,6})\s+(.+)$/);
  if (!headingMatch) {
    return null;
  }

  const level = headingMatch[1].length;
  const title = headingMatch[2].trim();
  const lines = markdown.split("\n");
  let startIdx = -1;
  let endIdx = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const lineMatch = lines[i].match(/^(#{1,6})\s+(.+)$/);
    if (!lineMatch) continue;

    if (startIdx === -1) {
      if (lineMatch[2].trim() === title && lineMatch[1].length === level) {
        startIdx = i;
      }
    } else if (lineMatch[1].length <= level) {
      endIdx = i;
      break;
    }
  }

  if (startIdx === -1) {
    return null;
  }

  return lines.slice(startIdx, endIdx).join("\n").trim();
}
