import ora from "ora";
import chalk from "chalk";
import { callChatGPTApi } from "../../ChatGPTApi";

export async function getPRDescription(
  prompt: string,
  diffContent: string,
): Promise<string> {
  const spinner = ora(chalk.blue("🤖 Generating PR description...")).start();
  try {
    const prDescription = await callChatGPTApi(prompt, diffContent);
    spinner.succeed(chalk.blue("PR description generated"));
    return prDescription;
  } catch (error) {
    spinner.fail("Failed to generate PR description.");
    throw error;
  }
}
