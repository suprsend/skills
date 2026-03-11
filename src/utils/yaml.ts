import { parse } from "yaml";

export function parseYaml<T>(content: string): T {
  const result = parse(content);
  if (result === null || result === undefined) {
    throw new Error("YAML parsed to null — is the file empty?");
  }
  return result as T;
}
