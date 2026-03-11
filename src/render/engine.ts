import Handlebars from "handlebars";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { SKILLS_SRC_DIR } from "../config.js";
import { registerHelpers } from "./helpers.js";
import { logger } from "../utils/logger.js";
import { assertWithinDir } from "../utils/path-safety.js";
import type { TemplateContext, SkillMeta } from "../sources/types.js";

let initialized = false;

function ensureInit(): void {
  if (!initialized) {
    registerHelpers(Handlebars);
    initialized = true;
  }
}

/**
 * Register partials from skills-src/<skill>/partials/.
 * Clears previously registered partials first to prevent leakage between skills.
 */
async function registerPartials(skillName: string): Promise<void> {
  // Clear all previously registered partials to isolate skills from each other
  const existing = Handlebars.partials;
  for (const name of Object.keys(existing)) {
    Handlebars.unregisterPartial(name);
  }

  const partialsDir = resolve(SKILLS_SRC_DIR, skillName, "partials");
  try {
    const entries = await readdir(partialsDir);
    for (const file of entries) {
      if (!file.endsWith(".hbs")) continue;
      const name = file.replace(/\.hbs$/, "");
      const content = await readFile(resolve(partialsDir, file), "utf-8");
      Handlebars.registerPartial(name, content);
      logger.debug(`Registered partial: ${name}`);
    }
  } catch {
    // No partials directory — that's fine
  }
}

/**
 * Render the main template for a skill.
 */
export async function renderTemplate(
  skillName: string,
  context: TemplateContext,
): Promise<string> {
  ensureInit();
  await registerPartials(skillName);

  const templatePath = resolve(
    SKILLS_SRC_DIR,
    skillName,
    "template.md.hbs",
  );
  const templateSource = await readFile(templatePath, "utf-8");
  const template = Handlebars.compile(templateSource, { noEscape: true });
  return template(context);
}

/**
 * Render a Handlebars template file (for references, scripts, or assets).
 */
export async function renderOutputFile(
  skillName: string,
  templateRelPath: string,
  context: TemplateContext,
): Promise<string> {
  ensureInit();
  await registerPartials(skillName);

  const skillDir = resolve(SKILLS_SRC_DIR, skillName);
  const templatePath = resolve(skillDir, templateRelPath);
  assertWithinDir(templatePath, skillDir, "Output template path");
  const templateSource = await readFile(templatePath, "utf-8");
  const template = Handlebars.compile(templateSource, { noEscape: true });
  return template(context);
}

/**
 * Read a static file from a skill's source subdirectory.
 */
export async function readStaticFile(
  skillName: string,
  subdir: string,
  filename: string,
): Promise<Buffer> {
  const baseDir = resolve(SKILLS_SRC_DIR, skillName, subdir);
  const filePath = resolve(baseDir, filename);
  assertWithinDir(filePath, baseDir, "Static file path");
  return readFile(filePath);
}

/**
 * Escape a string for safe use as a YAML double-quoted value.
 */
function yamlQuote(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
  return `"${escaped}"`;
}

/**
 * Generate YAML frontmatter from skill metadata.
 */
export function generateFrontmatter(meta: SkillMeta): string {
  const lines: string[] = ["---"];
  lines.push(`name: ${meta.name}`);
  lines.push(`description: ${yamlQuote(meta.description.trim())}`);
  if (meta.license) lines.push(`license: ${meta.license}`);
  if (meta.compatibility) lines.push(`compatibility: ${yamlQuote(meta.compatibility)}`);
  if (meta.metadata) {
    lines.push("metadata:");
    for (const [k, v] of Object.entries(meta.metadata)) {
      lines.push(`  ${k}: ${yamlQuote(v)}`);
    }
  }
  if (meta.allowed_tools) lines.push(`allowed-tools: ${yamlQuote(meta.allowed_tools)}`);
  lines.push("---");
  return lines.join("\n");
}

/**
 * Interpolate Handlebars expressions in a string using the given context.
 * Used for Claude prompts that reference other resolved keys.
 */
export function interpolate(
  text: string,
  context: Record<string, unknown>,
): string {
  ensureInit();
  const template = Handlebars.compile(text, { noEscape: true });
  return template(context);
}
