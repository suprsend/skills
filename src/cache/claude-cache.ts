import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { CACHE_DIR } from "../config.js";
import { logger } from "../utils/logger.js";

interface CacheEntry {
  model: string;
  promptHash: string;
  response: string;
  createdAt: string;
}

function computeKey(model: string, prompt: string): string {
  return createHash("sha256").update(`${model}:${prompt}`).digest("hex");
}

export async function getCached(
  model: string,
  prompt: string,
): Promise<string | null> {
  const key = computeKey(model, prompt);
  const filePath = resolve(CACHE_DIR, `${key}.json`);

  try {
    const raw = await readFile(filePath, "utf-8");
    const entry = JSON.parse(raw) as CacheEntry;
    if (entry.promptHash !== key) {
      logger.warn(`Cache integrity mismatch for ${key.slice(0, 8)}..., ignoring`);
      return null;
    }
    logger.info(`Cache hit for Claude (${key.slice(0, 8)}...)`);
    return entry.response;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    logger.warn(`Cache read error (${key.slice(0, 8)}...): ${err}`);
    return null;
  }
}

export async function setCache(
  model: string,
  prompt: string,
  response: string,
): Promise<void> {
  const key = computeKey(model, prompt);
  const filePath = resolve(CACHE_DIR, `${key}.json`);

  const entry: CacheEntry = {
    model,
    promptHash: key,
    response,
    createdAt: new Date().toISOString(),
  };

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(filePath, JSON.stringify(entry, null, 2));
  logger.debug(`Cached Claude response (${key.slice(0, 8)}...)`);
}
