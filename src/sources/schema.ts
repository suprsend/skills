import { fetchJson } from "../utils/fetch.js";
import type { SchemaSource } from "./types.js";
import { logger } from "../utils/logger.js";

type JsonSchema = Record<string, unknown>;

/**
 * Recursively resolve $ref pointers in a JSON Schema.
 * Handles both local (#/definitions/...) and remote HTTP refs.
 */
async function resolveRefs(
  schema: JsonSchema,
  baseUrl: string,
  cache: Map<string, JsonSchema>,
): Promise<JsonSchema> {
  if (typeof schema !== "object" || schema === null) {
    return schema;
  }

  if (Array.isArray(schema)) {
    const resolved = await Promise.all(
      schema.map((item) =>
        typeof item === "object" && item !== null
          ? resolveRefs(item as JsonSchema, baseUrl, cache)
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
    cache.set(refUrl, refSchema);
    return resolveRefs(refSchema, refUrl, cache);
  }

  const result: JsonSchema = {};
  for (const [key, value] of Object.entries(schema)) {
    if (typeof value === "object" && value !== null) {
      result[key] = await resolveRefs(value as JsonSchema, baseUrl, cache);
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
