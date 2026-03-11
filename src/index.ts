import { parseArgs } from "node:util";
import { build } from "./pipeline.js";
import { setLogLevel } from "./utils/logger.js";

const { values } = parseArgs({
  options: {
    skill: { type: "string", short: "s" },
    "no-cache": { type: "boolean", default: false },
    verbose: { type: "boolean", short: "v", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
});

if (values.help) {
  console.log(`
Usage: npm run build [-- options]

Options:
  --skill, -s <name>   Build a single skill
  --no-cache           Force fresh Claude API calls (bypass cache)
  --verbose, -v        Enable debug logging
  --help, -h           Show this help
`);
  process.exit(0);
}

if (values.verbose) {
  setLogLevel("debug");
}

try {
  await build({
    skill: values.skill,
    noCache: values["no-cache"],
  });
} catch (err) {
  console.error(`[ERROR] Build failed: ${(err as Error).message}`);
  process.exit(1);
}
