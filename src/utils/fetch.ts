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

// Authenticated GitHub API calls get 5,000 requests/hour instead of 60/IP.
// The token is only ever sent to api.github.com.
function requestInit(url: string): RequestInit {
  const init: RequestInit = { signal: AbortSignal.timeout(30_000) };
  const token = process.env.GITHUB_TOKEN;
  if (token && new URL(url).hostname === "api.github.com") {
    init.headers = { Authorization: `Bearer ${token}` };
  }
  return init;
}

export async function fetchText(url: string): Promise<string> {
  validateUrl(url);
  logger.debug(`Fetching ${url}`);
  const res = await fetch(url, requestInit(url));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}: ${res.statusText}`);
  }
  return res.text();
}

export async function fetchJson<T>(url: string): Promise<T> {
  validateUrl(url);
  logger.debug(`Fetching JSON ${url}`);
  const res = await fetch(url, requestInit(url));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
