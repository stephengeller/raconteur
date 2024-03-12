import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import prompts from "prompts"; // Import prompts
import { callChatGPTApi } from "./ChatGPTApi";
import dotenv from "dotenv";

dotenv.config();

const execAsync = promisify(exec);
const DIR_PATH = process.env.CURRENT_DIR || process.cwd();

async function getStagedGitDiff(): Promise<string> {
  try {
    const { stdout } = await execAsync(`git -C ${DIR_PATH} diff --cached`);
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
    "Please generate a concise commit message based on the following changes, following the Conventional Commits specification";
  try {
    return await callChatGPTApi(prompt, diff);
  } catch (error) {
    console.error(chalk.red("Failed to generate commit message:"), error);
    process.exit(1);
  }
}

async function commitChanges(commitMessage: string): Promise<void> {
  try {
    await execAsync(`git commit -m "${commitMessage}"`);
    console.log(chalk.green("Changes committed successfully."));
  } catch (error) {
    console.error(chalk.red("Failed to commit changes:"), error);
  }
}

async function main() {
  const diff = await getStagedGitDiff();
  if (diff) {
    const commitMessage = await generateCommitMessage(diff);
    console.log(chalk.green("Suggested commit message:"));
    console.log(chalk.yellow(commitMessage));

    // Prompt whether to commit with the suggested message
    const response = await prompts({
      type: "toggle",
      name: "value",
      message: "Do you want to commit with the above message?",
      initial: true,
      active: "yes",
      inactive: "no",
    });

    if (response.value) {
      await commitChanges(commitMessage);
    } else {
      console.log(chalk.yellow("Commit aborted by user."));
    }
  } else {
    console.log(chalk.red("No staged changes found."));
  }
}

main().catch((error) => {
  console.error(chalk.red("Unexpected error:"), error);
  process.exit(1);
});
