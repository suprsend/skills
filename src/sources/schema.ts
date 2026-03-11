import { fetchJson } from "../utils/fetch.js";
import type { SchemaSource } from "./types.js";
import { logger } from "../utils/logger.js";

type JsonSchema = Record<string, unknown>;

const MAX_REF_DEPTH = 20;

/**
 * Recursively resolve $ref pointers in a JSON Schema.
 * Handles both local (#/definitions/...) and remote HTTP refs.
 */
async function resolveRefs(
  schema: JsonSchema,
  baseUrl: string,
  cache: Map<string, JsonSchema>,
  depth: number = 0,
): Promise<JsonSchema> {
  if (depth > MAX_REF_DEPTH) {
    logger.warn(`$ref resolution exceeded max depth (${MAX_REF_DEPTH}), stopping`);
    return schema;
  }
  if (typeof schema !== "object" || schema === null) {
    return schema;
  }

  if (Array.isArray(schema)) {
    const resolved = await Promise.all(
      schema.map((item) =>
        typeof item === "object" && item !== null
          ? resolveRefs(item as JsonSchema, baseUrl, cache, depth + 1)
          : item,
      ),
    );
    return resolved as unknown as JsonSchema;
  }

  if ("$ref" in schema && typeof schema.$ref === "string") {
    const ref = schema.$ref;

    // Local ref: #/definitions/Foo
    if (ref.startsWith("#/")) {
      // Local refs are resolved by the consumer; keep them as-is
      return schema;
    }

    // Remote ref
    const refUrl = new URL(ref, baseUrl).href;
    if (cache.has(refUrl)) {
      return cache.get(refUrl)!;
    }

    logger.debug(`Resolving $ref: ${refUrl}`);
    const refSchema = await fetchJson<JsonSchema>(refUrl);
    const resolved = await resolveRefs(refSchema, refUrl, cache, depth + 1);
    cache.set(refUrl, resolved);
    return resolved;
  }

  const result: JsonSchema = {};
  for (const [key, value] of Object.entries(schema)) {
    if (typeof value === "object" && value !== null) {
      result[key] = await resolveRefs(value as JsonSchema, baseUrl, cache, depth + 1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function resolveSchema(source: SchemaSource): Promise<JsonSchema> {
  logger.info(`Fetching schema: ${source.url}`);
  const schema = await fetchJson<JsonSchema>(source.url);

  if (source.follow_refs) {
    const cache = new Map<string, JsonSchema>();
    cache.set(source.url, schema);
    return resolveRefs(schema, source.url, cache);
  }

  return schema;
}
