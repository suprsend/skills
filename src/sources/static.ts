import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { SKILLS_SRC_DIR } from "../config.js";
import type { StaticSource } from "./types.js";
import { logger } from "../utils/logger.js";
import { assertWithinDir } from "../utils/path-safety.js";

export async function resolveStatic(
  skillName: string,
  source: StaticSource,
): Promise<string> {
  const baseDir = resolve(SKILLS_SRC_DIR, skillName, "static");
  const filePath = resolve(baseDir, source.path);
  assertWithinDir(filePath, baseDir, "Static source path");
  logger.debug(`Reading static file: ${filePath}`);
  return readFile(filePath, "utf-8");
}
