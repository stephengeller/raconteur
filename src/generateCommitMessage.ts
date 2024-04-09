import { spawn } from "child_process";
import chalk from "chalk";
import prompts from "prompts"; // Import prompts
import { callChatGPTApi } from "./ChatGPTApi";
import dotenv from "dotenv";
import { getStagedGitDiff } from "./git";
import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import ora from 'ora'

dotenv.config();

const argv = yargs(hideBin(process.argv))
    .option("dir", {
      alias: "d",
      description: "Specify the directory of the git repository",
      type: "string",
      default: process.cwd(),
    })
    .help()
    .alias("help", "h")
    .parseSync();

process.chdir(argv.dir);

async function generateCommitMessage(diff: string): Promise<string> {
  if (!diff.trim()) {
    console.log(chalk.yellow("No changes detected in staged files."));
    return "No changes to commit.";
  }

  const spinner = ora(chalk.blue('Generating commit message...')).start();

  const prompt =
      "Please generate a concise commit message based on the following changes, following the Conventional Commits specification";
  try {
    const commitMessage = await callChatGPTApi(prompt, diff);
    spinner.succeed(chalk.blue('Commit message generated'));
    return commitMessage;
  } catch (error) {
    spinner.fail('Failed to generate commit message.');
    console.error(chalk.red("Failed to generate commit message:"), error);
    process.exit(1);
  }
}

async function commitChanges(commitMessage: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Remove starting and ending single or triple backticks from the commit message
    const cleanedCommitMessage = commitMessage.replace(/^`{1,3}|`{1,3}$/g, "");

    const commit = spawn("git", ["commit", "-m", cleanedCommitMessage], {
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
  const diff = await getStagedGitDiff(argv.dir);
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
