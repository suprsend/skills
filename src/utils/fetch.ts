import { logger } from "./logger.js";

function validateUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Unsupported URL scheme "${parsed.protocol}" — only http(s) allowed: ${url}`);
  }
}

export async function fetchText(url: string): Promise<string> {
  validateUrl(url);
  logger.debug(`Fetching ${url}`);
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}: ${res.statusText}`);
  }
  return res.text();
}

export async function fetchJson<T>(url: string): Promise<T> {
  validateUrl(url);
  logger.debug(`Fetching JSON ${url}`);
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
