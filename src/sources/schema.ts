import { fetchJson } from "../utils/fetch.js";
import type { SchemaSource } from "./types.js";
import { logger } from "../utils/logger.js";

type JsonSchema = Record<string, unknown>;

const MAX_REF_DEPTH = 20;

/**
 * Navigate a JSON object using a JSON Pointer fragment (e.g., "#/$definitions/foo").
 * Returns undefined if the path doesn't exist.
 */
function resolvePointer(schema: JsonSchema, fragment: string): unknown {
  // Strip leading "#/"
  const parts = fragment.replace(/^#\//, "").split("/");
  let current: unknown = schema;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Recursively resolve $ref pointers in a JSON Schema.
 * Handles both local (#/definitions/...) and remote HTTP refs.
 * Remote refs with hash fragments (e.g., "other.json#/$definitions/Foo")
 * are fetched and then navigated to the specific definition.
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

    // Remote ref — separate URL from hash fragment
    const refUrlObj = new URL(ref, baseUrl);
    const fragment = refUrlObj.hash; // e.g., "#/$definitions/foo" or ""
    refUrlObj.hash = "";
    const schemaUrl = refUrlObj.href;

    // Fetch & cache the remote schema (without fragment)
    let resolvedSchema: JsonSchema;
    if (cache.has(schemaUrl)) {
      resolvedSchema = cache.get(schemaUrl)!;
    } else {
      logger.debug(`Resolving $ref: ${schemaUrl}`);
      const rawSchema = await fetchJson<JsonSchema>(schemaUrl);
      resolvedSchema = await resolveRefs(rawSchema, schemaUrl, cache, depth + 1);
      cache.set(schemaUrl, resolvedSchema);
    }

    // Navigate to the specific definition if a hash fragment is present
    if (fragment && fragment.startsWith("#/")) {
      const target = resolvePointer(resolvedSchema, fragment);
      if (target != null && typeof target === "object") {
        return target as JsonSchema;
      }
      logger.warn(`Could not resolve fragment "${fragment}" in ${schemaUrl}`);
      return schema;
    }

    return resolvedSchema;
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
