import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { SKILLS_OUTPUT_DIR } from "./config.js";
import { fetchJson, fetchText } from "./utils/fetch.js";
import { logger } from "./utils/logger.js";

const REPO = "suprsend/cli";
const BRANCH = "main";
const REMOTE_PATH = "skills";

interface GitHubContent {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
}

/**
 * Recursively download a directory from GitHub into a local directory.
 */
async function downloadDir(
  remotePath: string,
  localDir: string,
): Promise<void> {
  const url = `https://api.github.com/repos/${REPO}/contents/${remotePath}?ref=${BRANCH}`;
  const contents = await fetchJson<GitHubContent[]>(url);

  await mkdir(localDir, { recursive: true });

  for (const item of contents) {
    const localPath = resolve(localDir, item.name);

    if (item.type === "dir") {
      await downloadDir(item.path, localPath);
    } else if (item.type === "file" && item.download_url) {
      const content = await fetchText(item.download_url);
      await writeFile(localPath, content);
      logger.debug(`Downloaded ${item.path}`);
    }
  }
}

/**
 * Pull external skills from the suprsend/cli GitHub repo
 * and place them in the skills output directory.
 */
export async function pullExternalSkills(): Promise<void> {
  logger.info(`Pulling external skills from ${REPO}/${REMOTE_PATH}@${BRANCH}`);

  const url = `https://api.github.com/repos/${REPO}/contents/${REMOTE_PATH}?ref=${BRANCH}`;
  const contents = await fetchJson<GitHubContent[]>(url);

  const skillDirs = contents.filter((item) => item.type === "dir");

  if (skillDirs.length === 0) {
    logger.warn(`No skill directories found in ${REPO}/${REMOTE_PATH}`);
    return;
  }

  for (const dir of skillDirs) {
    const targetDir = resolve(SKILLS_OUTPUT_DIR, dir.name);
    logger.info(`Pulling skill: ${dir.name}`);
    await downloadDir(dir.path, targetDir);
    logger.info(`Pulled skill: ${dir.name}`);
  }
}
