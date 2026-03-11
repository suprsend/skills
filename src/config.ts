import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = resolve(__dirname, "..");
export const SRC_DIR = resolve(ROOT_DIR, "src");
export const SKILLS_SRC_DIR = resolve(ROOT_DIR, "skills-src");
export const SKILLS_OUTPUT_DIR = resolve(ROOT_DIR, "skills");
export const CACHE_DIR = resolve(ROOT_DIR, ".cache", "claude");

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
export const DEFAULT_MODEL = "claude-sonnet-4-20250514";
export const DEFAULT_MAX_TOKENS = 4000;

export const MAX_SKILL_LINES = 500;
export const MAX_NAME_LENGTH = 64;
export const MAX_DESCRIPTION_LENGTH = 1024;
export const MAX_COMPATIBILITY_LENGTH = 500;
// Matches valid skill names: lowercase alphanumeric + single hyphens, no start/end hyphen.
// Consecutive hyphens (--) are checked separately in validateMeta.
export const NAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
