import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_API_KEY, DEFAULT_MODEL, DEFAULT_MAX_TOKENS } from "../config.js";
import type { ClaudeSource } from "./types.js";
import { getCached, setCache } from "../cache/claude-cache.js";
import { logger } from "../utils/logger.js";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY environment variable is required for claude sources",
      );
    }
    client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return client;
}

export async function resolveClaude(
  source: ClaudeSource,
  interpolatedPrompt: string,
  useCache: boolean,
): Promise<string> {
  const model = source.model ?? DEFAULT_MODEL;
  const maxTokens = source.max_tokens ?? DEFAULT_MAX_TOKENS;

  // Check cache
  if (useCache) {
    const cached = await getCached(model, interpolatedPrompt);
    if (cached !== null) {
      return cached;
    }
  }

  logger.info(`Calling Claude API (model: ${model}, key: ${source.key})`);
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: interpolatedPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  const response = textBlock ? textBlock.text : "";

  // Save to cache
  await setCache(model, interpolatedPrompt, response);

  return response;
}
