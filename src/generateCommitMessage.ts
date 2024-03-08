import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import { callChatGPTApi } from "./ChatGPTApi";
import dotenv from "dotenv";

dotenv.config();

const execAsync = promisify(exec);

async function getStagedGitDiff(): Promise<string> {
  try {
    const { stdout } = await execAsync("git diff --cached");
    return stdout;
  } catch (error) {
    console.error(chalk.red("Error obtaining staged git diff:"), error);
    process.exit(1);
  }
}

async function generateCommitMessage(diff: string): Promise<string> {
  if (!diff.trim()) {
    console.log(chalk.yellow("No changes detected in staged files."));
    return "No changes to commit.";
  }

  console.log(chalk.blue("Generating commit message..."));

  const prompt =
    "Please generate a short, succinct commit message based on the following changes, following the Conventional Commits specification";
  try {
    return await callChatGPTApi(prompt, diff);
  } catch (error) {
    console.error(chalk.red("Failed to generate commit message:"), error);
    process.exit(1);
  }
}

async function main() {
  const diff = await getStagedGitDiff();
  if (diff) {
    const commitMessage = await generateCommitMessage(diff);
    console.log(chalk.green("Suggested commit message:"));
    console.log(chalk.yellow(commitMessage));
  } else {
    console.log(chalk.red("No staged changes found."));
  }
}

main().catch((error) => {
  console.error(chalk.red("Unexpected error:"), error);
  process.exit(1);
});
