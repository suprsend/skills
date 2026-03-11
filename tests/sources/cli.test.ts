import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveCli } from "../../src/sources/cli.js";
import type { CliSource } from "../../src/sources/types.js";

vi.spyOn(console, "log").mockImplementation(() => {});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveCli", () => {
  describe("JSON format", () => {
    it("parses JSON output from a command", async () => {
      const source: CliSource = {
        type: "cli",
        key: "data",
        command: 'echo \'{"name":"test","count":42}\'',
        format: "json",
      };
      const result = await resolveCli(source);
      expect(result).toEqual({ name: "test", count: 42 });
    });

    it("parses JSON array output", async () => {
      const source: CliSource = {
        type: "cli",
        key: "items",
        command: 'echo \'[1,2,3]\'',
        format: "json",
      };
      const result = await resolveCli(source);
      expect(result).toEqual([1, 2, 3]);
    });

    it("throws on invalid JSON output", async () => {
      const source: CliSource = {
        type: "cli",
        key: "bad",
        command: "echo 'not json'",
        format: "json",
      };
      await expect(resolveCli(source)).rejects.toThrow();
    });
  });

  describe("YAML format", () => {
    it("parses YAML output from a command", async () => {
      const source: CliSource = {
        type: "cli",
        key: "data",
        command: "printf 'name: test\\ncount: 42\\n'",
        format: "yaml",
      };
      const result = await resolveCli(source);
      expect(result).toEqual({ name: "test", count: 42 });
    });

    it("parses YAML list output", async () => {
      const source: CliSource = {
        type: "cli",
        key: "items",
        command: `echo '- one
- two
- three'`,
        format: "yaml",
      };
      const result = await resolveCli(source);
      expect(result).toEqual(["one", "two", "three"]);
    });
  });

  describe("error handling", () => {
    it("throws on command failure (non-zero exit)", async () => {
      const source: CliSource = {
        type: "cli",
        key: "fail",
        command: "exit 1",
        format: "json",
      };
      await expect(resolveCli(source)).rejects.toThrow();
    });

    it("throws on command not found", async () => {
      const source: CliSource = {
        type: "cli",
        key: "missing",
        command: "nonexistent_command_xyz_123",
        format: "json",
      };
      await expect(resolveCli(source)).rejects.toThrow();
    });

    it("throws on empty output with JSON format", async () => {
      const source: CliSource = {
        type: "cli",
        key: "empty",
        command: "echo ''",
        format: "json",
      };
      await expect(resolveCli(source)).rejects.toThrow();
    });
  });
});
