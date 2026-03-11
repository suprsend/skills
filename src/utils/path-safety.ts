import { sep } from "node:path";

/**
 * Assert that a resolved path stays within the expected base directory.
 * Prevents path traversal attacks from user-controlled inputs.
 */
export function assertWithinDir(resolved: string, base: string, label: string): void {
  if (!resolved.startsWith(base + sep) && resolved !== base) {
    throw new Error(`${label}: path traversal detected — "${resolved}" is outside "${base}"`);
  }
}
