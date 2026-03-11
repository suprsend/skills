import { parse } from "yaml";

export function parseYaml<T>(content: string): T {
  return parse(content) as T;
}
