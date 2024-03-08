import fs from "fs";
import chalk from "chalk";
import prompts from "prompts";
import { CUSTOM_PROMPT_PATH } from "./generatePrDescription";

export async function maybeRewritePrompt(inputPrompt: string): Promise<string> {
  let finalPrompt = null;
  const customPrompt = await prompts({
    type: "toggle",
    name: "value",
    message: chalk.yellow("✏️ Do you want to re-write the prompt?"),
    initial: false,
    active: "yes",
    inactive: "no",
  });

  if (customPrompt.value) {
    const response = await prompts({
      type: "text",
      name: "value",
      message: chalk.cyan("📝 Enter your custom prompt:"),
    });
    finalPrompt = response.value;
    saveCustomPrompt(finalPrompt);
  }

  return finalPrompt ?? inputPrompt;
}

export async function extraContextPrompt(inputPrompt: string): Promise<string> {
  let finalPrompt = inputPrompt;
  const extraContextPrompt = await prompts({
    type: "toggle",
    name: "value",
    message: chalk.yellow("✏️ Do you want to add any context to the prompt?"),
    initial: false,
    active: "yes",
    inactive: "no",
  });

  if (extraContextPrompt.value) {
    const response = await prompts({
      type: "text",
      name: "value",
      message: chalk.cyan("📝 Enter your extra contegxt:"),
    });
    finalPrompt += response.value;
  }

  return finalPrompt;
}

function saveCustomPrompt(prompt: string): void {
  try {
    fs.writeFileSync(CUSTOM_PROMPT_PATH, prompt, "utf8");
    console.log(chalk.green("✅  Custom prompt saved for future use."));
  } catch (error) {
    console.error(chalk.red(`Error saving custom prompt: ${error}`));
  }
}
