import * as fs from "fs";
import path from "path";
import chalk from "chalk";

export const CUSTOM_PROMPT_PATH = path.resolve(
  `./customPrDescriptionPrompt.txt`,
);

export function loadCustomPrompt(
  customPromptPath = CUSTOM_PROMPT_PATH,
): string | null {
  try {
    if (fs.existsSync(customPromptPath)) {
      return fs.readFileSync(customPromptPath, "utf8");
    }
  } catch (error) {
    console.warn(
      chalk.yellow(
        `Warning: Failed to load custom prompt from ${customPromptPath}`,
      ),
    );
  }
  return null;
}
