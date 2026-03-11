import { execSync } from "node:child_process";
import type { CliSource } from "./types.js";
import { parseYaml } from "../utils/yaml.js";
import { logger } from "../utils/logger.js";

export async function resolveCli(source: CliSource): Promise<unknown> {
  logger.info(`Running CLI command: ${source.command}`);
  const output = execSync(source.command, {
    encoding: "utf-8",
    timeout: 30_000,
  });

  if (source.format === "json") {
    return JSON.parse(output);
  }
  return parseYaml(output);
}
