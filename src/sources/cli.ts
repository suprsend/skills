import { exec } from "node:child_process";
import type { CliSource } from "./types.js";
import { parseYaml } from "../utils/yaml.js";
import { logger } from "../utils/logger.js";

function execAsync(command: string, timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { encoding: "utf-8", timeout }, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

export async function resolveCli(source: CliSource): Promise<unknown> {
  logger.info(`Running CLI command: ${source.command}`);
  const output = await execAsync(source.command, 30_000);

  if (source.format === "json") {
    return JSON.parse(output);
  }
  return parseYaml(output);
}
