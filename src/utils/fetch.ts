import { logger } from "./logger.js";

export async function fetchText(url: string): Promise<string> {
  logger.debug(`Fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}: ${res.statusText}`);
  }
  return res.text();
}

export async function fetchJson<T>(url: string): Promise<T> {
  logger.debug(`Fetching JSON ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
