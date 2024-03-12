import { spawn } from "child_process";
import chalk from "chalk";
import prompts from "prompts"; // Import prompts
import { callChatGPTApi } from "./ChatGPTApi";
import dotenv from "dotenv";
import { getStagedGitDiff } from "./git";

dotenv.config();

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
  return new Promise((resolve, reject) => {
    const commit = spawn("git", ["commit", "-m", commitMessage], {
      stdio: "inherit",
    });

    commit.on("close", (code) => {
      if (code === 0) {
        console.log(chalk.green("Changes committed successfully."));
        resolve();
      } else {
        console.error(
          chalk.red(`Failed to commit changes with exit code: ${code}`),
        );
        reject(new Error(`git commit command failed with exit code ${code}`));
      }
    });

    commit.on("error", (error) => {
      console.error(chalk.red("Failed to commit changes:"), error);
      reject(error);
    });
  });
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
