import * as fs from "fs";
import path from "path";
import chalk from "chalk";

export const CUSTOM_PROMPT_PATH = path.resolve(`./customPrDescriptionPrompt.txt`);

export function loadCustomPrompt(): string | null {
  try {
    if (fs.existsSync(CUSTOM_PROMPT_PATH)) {
      return fs.readFileSync(CUSTOM_PROMPT_PATH, "utf8");
    }
  } catch (error) {
    console.warn(
      chalk.yellow(`Warning: Failed to load custom prompt from ${CUSTOM_PROMPT_PATH}`)
    );
  }
  return null;
}
