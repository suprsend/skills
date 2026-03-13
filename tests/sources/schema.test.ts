import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveSchema } from "../../src/sources/schema.js";
import type { SchemaSource } from "../../src/sources/types.js";

describe("resolveSchema", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and returns a JSON Schema", async () => {
    const schema = {
      type: "object",
      properties: { name: { type: "string" } },
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(schema), { status: 200 }),
    );

    const source: SchemaSource = {
      type: "schema",
      key: "schema",
      url: "https://schema.example.com/v1/schema.json",
    };
    const result = await resolveSchema(source);
    expect(result).toEqual(schema);
  });

  it("returns schema without resolving refs when follow_refs is false", async () => {
    const schema = {
      type: "object",
      properties: {
        nested: { $ref: "https://schema.example.com/nested.json" },
      },
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(schema), { status: 200 }),
    );

    const source: SchemaSource = {
      type: "schema",
      key: "schema",
      url: "https://schema.example.com/v1/schema.json",
      follow_refs: false,
    };
    const result = await resolveSchema(source);
    expect(result.properties).toHaveProperty("nested");
    const nested = (result.properties as Record<string, unknown>)["nested"] as Record<string, unknown>;
    expect(nested.$ref).toBe("https://schema.example.com/nested.json");
  });

  it("returns schema without resolving refs when follow_refs is undefined", async () => {
    const schema = {
      type: "object",
      properties: {
        nested: { $ref: "https://schema.example.com/nested.json" },
      },
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(schema), { status: 200 }),
    );

    const source: SchemaSource = {
      type: "schema",
      key: "schema",
      url: "https://schema.example.com/v1/schema.json",
    };
    const result = await resolveSchema(source);
    const nested = (result.properties as Record<string, unknown>)["nested"] as Record<string, unknown>;
    expect(nested.$ref).toBe("https://schema.example.com/nested.json");
  });

  describe("with follow_refs: true", () => {
    it("keeps local $ref (#/) as-is", async () => {
      const schema = {
        type: "object",
        properties: {
          nested: { $ref: "#/definitions/Thing" },
        },
        definitions: {
          Thing: { type: "string" },
        },
      };
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify(schema), { status: 200 }),
      );

      const source: SchemaSource = {
        type: "schema",
        key: "schema",
        url: "https://schema.example.com/v1/schema.json",
        follow_refs: true,
      };
      const result = await resolveSchema(source);
      const nested = (result.properties as Record<string, unknown>)["nested"] as Record<string, unknown>;
      expect(nested.$ref).toBe("#/definitions/Thing");
    });

    it("resolves remote $ref by fetching", async () => {
      const mainSchema = {
        type: "object",
        properties: {
          nested: { $ref: "https://schema.example.com/nested.json" },
        },
      };
      const nestedSchema = {
        type: "string",
        description: "resolved nested",
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mainSchema), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(nestedSchema), { status: 200 }),
        );

      const source: SchemaSource = {
        type: "schema",
        key: "schema",
        url: "https://schema.example.com/v1/schema.json",
        follow_refs: true,
      };
      const result = await resolveSchema(source);
      const nested = (result.properties as Record<string, unknown>)["nested"] as Record<string, unknown>;
      expect(nested).toEqual(nestedSchema);
    });

    it("caches resolved remote refs (avoids duplicate fetches)", async () => {
      const mainSchema = {
        type: "object",
        properties: {
          a: { $ref: "https://schema.example.com/shared.json" },
          b: { $ref: "https://schema.example.com/shared.json" },
        },
      };
      const sharedSchema = { type: "string" };

      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mainSchema), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(sharedSchema), { status: 200 }),
        );

      const source: SchemaSource = {
        type: "schema",
        key: "schema",
        url: "https://schema.example.com/v1/schema.json",
        follow_refs: true,
      };
      await resolveSchema(source);
      // Only 2 fetches: the main schema + the shared ref (not fetched twice)
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("handles arrays in schema", async () => {
      const schema = {
        type: "object",
        oneOf: [
          { $ref: "https://schema.example.com/a.json" },
          { type: "string" },
        ],
      };
      const aSchema = { type: "number" };

      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(schema), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(aSchema), { status: 200 }),
        );

      const source: SchemaSource = {
        type: "schema",
        key: "schema",
        url: "https://schema.example.com/v1/schema.json",
        follow_refs: true,
      };
      const result = await resolveSchema(source);
      expect((result.oneOf as unknown[])[0]).toEqual(aSchema);
      expect((result.oneOf as unknown[])[1]).toEqual({ type: "string" });
    });

    it("resolves remote $ref with hash fragment to specific definition", async () => {
      const mainSchema = {
        type: "object",
        properties: {
          delay: {
            $ref: "https://schema.example.com/fragment.json#/$definitions/delay_props",
          },
        },
      };
      const fragmentSchema = {
        $definitions: {
          delay_props: {
            type: "object",
            properties: {
              delay_type: { type: "string", enum: ["fixed", "dynamic"] },
            },
            required: ["delay_type"],
          },
          other_props: {
            type: "object",
            properties: { unused: { type: "string" } },
          },
        },
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mainSchema), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(fragmentSchema), { status: 200 }),
        );

      const source: SchemaSource = {
        type: "schema",
        key: "schema",
        url: "https://schema.example.com/v1/schema.json",
        follow_refs: true,
      };
      const result = await resolveSchema(source);
      const delay = (result.properties as Record<string, unknown>)["delay"] as Record<string, unknown>;
      // Should navigate to the specific definition, not return the whole schema
      expect(delay).toEqual(fragmentSchema.$definitions.delay_props);
      expect(delay).not.toHaveProperty("$ref");
    });

    it("caches remote schema and resolves different fragments from same file", async () => {
      const mainSchema = {
        type: "object",
        properties: {
          a: { $ref: "https://schema.example.com/defs.json#/$definitions/alpha" },
          b: { $ref: "https://schema.example.com/defs.json#/$definitions/beta" },
        },
      };
      const defsSchema = {
        $definitions: {
          alpha: { type: "string", description: "alpha" },
          beta: { type: "number", description: "beta" },
        },
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mainSchema), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(defsSchema), { status: 200 }),
        );

      const source: SchemaSource = {
        type: "schema",
        key: "schema",
        url: "https://schema.example.com/v1/schema.json",
        follow_refs: true,
      };
      const result = await resolveSchema(source);
      const a = (result.properties as Record<string, unknown>)["a"] as Record<string, unknown>;
      const b = (result.properties as Record<string, unknown>)["b"] as Record<string, unknown>;
      expect(a).toEqual({ type: "string", description: "alpha" });
      expect(b).toEqual({ type: "number", description: "beta" });
      // Only 2 fetches: main + defs (not fetched twice)
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("keeps original $ref when fragment target not found", async () => {
      const mainSchema = {
        type: "object",
        properties: {
          missing: {
            $ref: "https://schema.example.com/defs.json#/$definitions/nonexistent",
          },
        },
      };
      const defsSchema = {
        $definitions: {
          other: { type: "string" },
        },
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mainSchema), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(defsSchema), { status: 200 }),
        );

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const source: SchemaSource = {
        type: "schema",
        key: "schema",
        url: "https://schema.example.com/v1/schema.json",
        follow_refs: true,
      };
      const result = await resolveSchema(source);
      const missing = (result.properties as Record<string, unknown>)["missing"] as Record<string, unknown>;
      // Original $ref preserved when target not found
      expect(missing.$ref).toBe(
        "https://schema.example.com/defs.json#/$definitions/nonexistent",
      );

      warnSpy.mockRestore();
    });

    it("resolves relative $ref URLs against base", async () => {
      const mainSchema = {
        type: "object",
        properties: {
          nested: { $ref: "nested.json" },
        },
      };
      const nestedSchema = { type: "integer" };

      vi.mocked(fetch)
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mainSchema), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(nestedSchema), { status: 200 }),
        );

      const source: SchemaSource = {
        type: "schema",
        key: "schema",
        url: "https://schema.example.com/v1/schema.json",
        follow_refs: true,
      };
      const result = await resolveSchema(source);
      // Relative "nested.json" should resolve against the base URL directory
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        "https://schema.example.com/v1/nested.json",
        expect.anything(),
      );
    });
  });

  it("stops resolving refs beyond max depth", async () => {
    // Build a chain of schemas that each reference the next
    const schemas: Record<string, object> = {};
    for (let i = 0; i <= 25; i++) {
      if (i < 25) {
        schemas[`https://schema.example.com/${i}.json`] = {
          type: "object",
          properties: {
            next: { $ref: `https://schema.example.com/${i + 1}.json` },
          },
        };
      } else {
        schemas[`https://schema.example.com/${i}.json`] = { type: "string" };
      }
    }

    vi.mocked(fetch).mockImplementation(async (url) => {
      const schema = schemas[url as string];
      if (schema) {
        return new Response(JSON.stringify(schema), { status: 200 });
      }
      return new Response("", { status: 404, statusText: "Not Found" });
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const source: SchemaSource = {
      type: "schema",
      key: "schema",
      url: "https://schema.example.com/0.json",
      follow_refs: true,
    };

    // Should complete without stack overflow
    const result = await resolveSchema(source);
    expect(result).toBeDefined();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("throws on fetch failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("", { status: 500, statusText: "Server Error" }),
    );

    const source: SchemaSource = {
      type: "schema",
      key: "schema",
      url: "https://schema.example.com/v1/schema.json",
    };
    await expect(resolveSchema(source)).rejects.toThrow("HTTP 500");
  });
});
