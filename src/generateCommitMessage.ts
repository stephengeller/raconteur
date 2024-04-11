import { spawn } from "child_process";
import chalk from "chalk";
import prompts from "prompts"; // Import prompts
import { callChatGPTApi } from "./ChatGPTApi";
import dotenv from "dotenv";
import { getStagedFiles, getStagedGitDiff } from "./git";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import ora from "ora";
import { printBoxFooter, printBoxHeader, printCommitMessage } from "./utils";

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

  const spinner = ora(chalk.blue("Generating commit message...")).start();

  const prompt =
    "Please generate a concise commit message based on the following changes, following the Conventional Commits specification";
  try {
    const commitMessage = await callChatGPTApi(prompt, diff);
    spinner.succeed(chalk.blue("Commit message generated"));
    return commitMessage;
  } catch (error) {
    spinner.fail("Failed to generate commit message.");
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

// Function to handle the commit process
export async function handleCommit(commitMessage: string) {
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
}

function truncatePath(path: string, maxLength: number) {
  if (path.length <= maxLength) {
    return path;
  }
  return "..." + path.slice(-maxLength + 3); // +3 for the length of '...'
}

function printStagedFiles(
  stagedFiles: { file: string; additions: number; deletions: number }[],
) {
  const maxFilePathLength = 40;
  const header = "Staged files to be committed:";
  const headerLength = header.length;
  const maxLineLength = Math.max(
    ...stagedFiles.map(
      ({ file, additions, deletions }) =>
        `${truncatePath(file, maxFilePathLength)} (+${additions}) (-${deletions})`
          .length,
    ),
    headerLength,
  );

  const totalWidth = Math.max(50, maxLineLength + 4); // Add some padding
  const contentWidth = totalWidth - 2; // Account for the borders

  printBoxHeader(contentWidth, header);

  stagedFiles.forEach(({ file, additions, deletions }) => {
    const truncatedFile = truncatePath(file, maxFilePathLength);
    const fileInfo = `${truncatedFile} (+${additions}) (-${deletions})`;
    const filePaddingLength = contentWidth - fileInfo.length;
    const filePadding = " ".repeat(Math.max(0, filePaddingLength));
    console.log(
      chalk.blueBright("│ ") +
        chalk.yellowBright(truncatedFile) +
        chalk.greenBright(` (+${additions})`) +
        chalk.redBright(` (-${deletions})`) +
        filePadding +
        chalk.blueBright("│"),
    );
  });

  printBoxFooter(contentWidth);
}

// Main function refactored with smaller functions
async function main() {
  const diff = await getStagedGitDiff(argv.dir);
  const stagedFiles = await getStagedFiles(argv.dir);

  if (diff) {
    printStagedFiles(stagedFiles);

    const commitMessage = await generateCommitMessage(diff);
    printCommitMessage(commitMessage);
    await handleCommit(commitMessage);
  } else {
    console.log(chalk.red("No staged changes found."));
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red("Unexpected error:"), error);
    process.exit(1);
  });
}
