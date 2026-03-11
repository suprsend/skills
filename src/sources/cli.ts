import { execFile } from "node:child_process";
import type { CliSource } from "./types.js";
import { parseYaml } from "../utils/yaml.js";
import { logger } from "../utils/logger.js";

/**
 * Parse a command string into executable and arguments.
 * Handles simple quoting (single and double quotes) but not shell features
 * like pipes, redirections, or variable expansion.
 */
function parseCommand(command: string): [string, string[]] {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (ch === " " && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current.length > 0) tokens.push(current);

  if (tokens.length === 0) {
    throw new Error("Empty command");
  }
  return [tokens[0], tokens.slice(1)];
}

function execAsync(command: string, timeout: number): Promise<string> {
  const [bin, args] = parseCommand(command);
  return new Promise((resolve, reject) => {
    execFile(bin, args, { encoding: "utf-8", timeout }, (error, stdout, stderr) => {
      if (error) {
        const msg = stderr ? `${error.message}\nstderr: ${stderr}` : error.message;
        reject(new Error(msg));
      } else {
        if (stderr) logger.debug(`CLI stderr: ${stderr}`);
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
