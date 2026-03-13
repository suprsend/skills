import { readFile, writeFile, mkdir, readdir, chmod } from "node:fs/promises";
import { resolve } from "node:path";
import {
  SKILLS_SRC_DIR,
  SKILLS_OUTPUT_DIR,
  MAX_SKILL_LINES,
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_COMPATIBILITY_LENGTH,
  NAME_PATTERN,
} from "./config.js";
import { assertWithinDir } from "./utils/path-safety.js";
import type {
  SourcesConfig,
  SourceDeclaration,
  SkillMeta,
  TemplateContext,
  ClaudeSource,
  OutputFileDeclaration,
} from "./sources/types.js";
import { parseYaml } from "./utils/yaml.js";
import { logger } from "./utils/logger.js";
import { pullExternalSkills } from "./external.js";
import { resolveStatic } from "./sources/static.js";
import { resolveDocs } from "./sources/docs.js";
import { resolveSchema } from "./sources/schema.js";
import { resolveClaude } from "./sources/claude.js";
import {
  renderTemplate,
  renderOutputFile,
  readStaticFile,
  generateFrontmatter,
  interpolate,
} from "./render/engine.js";

interface BuildOptions {
  skill?: string;
  noCache?: boolean;
  pullExternal?: boolean;
}

/**
 * Validate skill metadata against agentskills.io spec.
 */
function validateMeta(config: SourcesConfig): void {
  const { name, description, compatibility } = config;

  if (!name) throw new Error("Skill name is required");
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(`Skill name exceeds ${MAX_NAME_LENGTH} chars: "${name}"`);
  }
  if (!NAME_PATTERN.test(name)) {
    throw new Error(
      `Skill name must be lowercase letters, numbers, hyphens (no start/end hyphen): "${name}"`,
    );
  }
  if (name.includes("--")) {
    throw new Error(
      `Skill name must not contain consecutive hyphens: "${name}"`,
    );
  }

  if (!description) throw new Error("Skill description is required");
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(
      `Description exceeds ${MAX_DESCRIPTION_LENGTH} chars (got ${description.length})`,
    );
  }

  if (compatibility && compatibility.length > MAX_COMPATIBILITY_LENGTH) {
    throw new Error(
      `Compatibility exceeds ${MAX_COMPATIBILITY_LENGTH} chars (got ${compatibility.length})`,
    );
  }

  // Check for duplicate source keys
  const keys = new Set<string>();
  for (const source of config.sources) {
    if (keys.has(source.key)) {
      throw new Error(`Duplicate source key: "${source.key}"`);
    }
    keys.add(source.key);
  }
}

/**
 * Resolve a single non-claude source.
 */
async function resolveSource(
  skillName: string,
  source: SourceDeclaration,
): Promise<unknown> {
  switch (source.type) {
    case "static":
      return resolveStatic(skillName, source);
case "docs":
      return resolveDocs(source);
    case "schema":
      return resolveSchema(source);
    case "claude":
      // Claude sources handled separately in phase 2
      return null;
  }
}

/**
 * Write output files (references, scripts, or assets) to the skill output directory.
 *
 * Each declaration can be:
 * - Templated: has a `template` field → render .hbs with context
 * - Static copy: no `template` → copy from skills-src/<skill>/<subdir>/<filename>
 */
async function writeOutputFiles(
  skillName: string,
  outputDir: string,
  subdir: string,
  declarations: OutputFileDeclaration[],
  context: TemplateContext,
  executable = false,
): Promise<void> {
  const targetDir = resolve(outputDir, subdir);
  await mkdir(targetDir, { recursive: true });

  for (const decl of declarations) {
    const targetPath = resolve(targetDir, decl.filename);
    assertWithinDir(targetPath, targetDir, "Output file path");

    if (decl.template) {
      // Templated: render .hbs file with context
      const content = await renderOutputFile(skillName, decl.template, context);
      await writeFile(targetPath, content);
    } else {
      // Static copy: read from skills-src/<skill>/<subdir>/<filename>
      const content = await readStaticFile(skillName, subdir, decl.filename);
      await writeFile(targetPath, content);
    }

    if (executable) {
      await chmod(targetPath, 0o755);
    }
    logger.info(`Wrote skills/${skillName}/${subdir}/${decl.filename}`);
  }
}

/**
 * Build a single skill.
 */
async function buildSkill(
  skillName: string,
  options: BuildOptions,
): Promise<void> {
  logger.info(`Building skill: ${skillName}`);

  // 1. Parse sources.yaml
  const configPath = resolve(SKILLS_SRC_DIR, skillName, "sources.yaml");
  const configRaw = await readFile(configPath, "utf-8");
  const config = parseYaml<SourcesConfig>(configRaw);

  // 2. Validate metadata
  validateMeta(config);

  // Ensure directory name matches skill name
  if (skillName !== config.name) {
    throw new Error(
      `Directory name "${skillName}" must match skill name "${config.name}" in sources.yaml`,
    );
  }

  // 3. Phase 1: Resolve non-claude sources in parallel
  const nonClaudeSources = config.sources.filter((s) => s.type !== "claude");
  const claudeSources = config.sources.filter(
    (s): s is ClaudeSource => s.type === "claude",
  );

  const resolved: Record<string, unknown> = {};

  const phase1Results = await Promise.all(
    nonClaudeSources.map(async (source) => ({
      key: source.key,
      value: await resolveSource(skillName, source),
    })),
  );

  for (const { key, value } of phase1Results) {
    resolved[key] = value;
  }

  // 4. Phase 2: Resolve claude sources (sequentially, as they may reference each other)
  for (const source of claudeSources) {
    const interpolatedPrompt = interpolate(source.prompt, resolved);
    const value = await resolveClaude(
      source,
      interpolatedPrompt,
      !options.noCache,
    );
    resolved[source.key] = value;
  }

  // 5. Assemble template context
  const meta: SkillMeta = {
    name: config.name,
    description: config.description,
    ...(config.license && { license: config.license }),
    ...(config.compatibility && { compatibility: config.compatibility }),
    ...(config.metadata && { metadata: config.metadata }),
    ...(config.allowed_tools && { allowed_tools: config.allowed_tools }),
  };

  const context: TemplateContext = {
    ...resolved,
    meta,
  };

  // 6. Render template
  const body = await renderTemplate(skillName, context);

  // 7. Prepend frontmatter
  const frontmatter = generateFrontmatter(meta);
  const skillMd = `${frontmatter}\n\n${body}`;

  // 8. Validate output
  const lineCount = skillMd.split("\n").length;
  if (lineCount > MAX_SKILL_LINES) {
    logger.warn(
      `SKILL.md for "${skillName}" has ${lineCount} lines (recommended max: ${MAX_SKILL_LINES})`,
    );
  }

  // 9. Write SKILL.md
  const outputDir = resolve(SKILLS_OUTPUT_DIR, skillName);
  await mkdir(outputDir, { recursive: true });
  await writeFile(resolve(outputDir, "SKILL.md"), skillMd);
  logger.info(`Wrote skills/${skillName}/SKILL.md (${lineCount} lines)`);

  // 10. Write output subdirectories (references, scripts, assets)
  if (config.references?.length) {
    await writeOutputFiles(skillName, outputDir, "references", config.references, context);
  }
  if (config.scripts?.length) {
    await writeOutputFiles(skillName, outputDir, "scripts", config.scripts, context, true);
  }
  if (config.assets?.length) {
    await writeOutputFiles(skillName, outputDir, "assets", config.assets, context);
  }
}

/**
 * Discover all skills in skills-src/.
 */
async function discoverSkills(): Promise<string[]> {
  const entries = await readdir(SKILLS_SRC_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
}

/**
 * Main build entry point.
 */
export async function build(options: BuildOptions): Promise<void> {
  if (options.skill && !NAME_PATTERN.test(options.skill)) {
    throw new Error(`Invalid skill name: "${options.skill}"`);
  }

  const skills = options.skill
    ? [options.skill]
    : await discoverSkills();

  if (skills.length > 0) {
    logger.info(`Building ${skills.length} skill(s): ${skills.join(", ")}`);

    const errors: Array<{ skill: string; error: Error }> = [];
    for (const skill of skills) {
      try {
        await buildSkill(skill, options);
      } catch (err) {
        errors.push({ skill, error: err as Error });
        logger.error(`Failed to build "${skill}": ${(err as Error).message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `${errors.length} skill(s) failed to build: ${errors.map((e) => e.skill).join(", ")}`,
      );
    }
  } else {
    logger.info("No local skills found in skills-src/");
  }

  // Pull external skills (unless --no-external)
  if (options.pullExternal !== false) {
    await pullExternalSkills();
  }

  logger.info("Build complete.");
}
