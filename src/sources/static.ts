import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { SKILLS_SRC_DIR } from "../config.js";
import type { StaticSource } from "./types.js";
import { logger } from "../utils/logger.js";

export async function resolveStatic(
  skillName: string,
  source: StaticSource,
): Promise<string> {
  const filePath = resolve(SKILLS_SRC_DIR, skillName, "static", source.path);
  logger.debug(`Reading static file: ${filePath}`);
  return readFile(filePath, "utf-8");
}
