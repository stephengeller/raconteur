import { spawn } from "child_process";
import chalk from "chalk";
import prompts from "prompts"; // Import prompts
import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import ora from "ora";
import { callChatGPTApi } from "../ChatGPTApi";
import { getStagedFiles, getStagedGitDiff } from "../git";

const MAX_FILE_LENGTH = 30;

dotenv.config();

const argv = yargs(hideBin(process.argv))
  .option("dir", {
    alias: "d",
    description: "Specify the directory of the git repository",
    type: "string",
    default: process.cwd(),
  })
  .option("all", {
    alias: "a",
    description: "Add all changes before committing",
    type: "boolean",
    default: false,
  })
  .option("yes", {
    alias: "y",
    description: "Automatically accept all prompts",
    type: "boolean",
    default: false,
  })
  .option("silent", {
    alias: "s",
    description: "Silence all output",
    type: "boolean",
    default: false,
  })
  .positional("context", {
    describe: "Additional context for the commit message",
    type: "string",
    default: "",
  })
  .help()
  .alias("help", "h")
  .parseSync();

process.chdir(argv.dir);

function log(message: string) {
  if (!argv.silent) {
    console.log(message);
  }
}

async function generateCommitMessage(
  diff: string,
  context: string | undefined = undefined,
): Promise<string> {
  if (!diff.trim()) {
    log(chalk.yellow("No changes detected in staged files."));
    return "No changes to commit.";
  }

  const spinner = ora(chalk.blue("Generating commit message..."));
  if (!argv.silent) spinner.start();

  let prompt = `Please generate a concise commit message based on the following changes, following the Conventional Commits specification.`;
  if (context) {
    prompt += ` Some extra context for this diff: "${context}"`;
  }
  try {
    const commitMessage = await callChatGPTApi(prompt, diff);
    if (!argv.silent) spinner.succeed(chalk.blue("Commit message generated"));
    return commitMessage;
  } catch (error) {
    if (!argv.silent) spinner.fail("Failed to generate commit message.");
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
        log(chalk.green("Changes committed successfully."));
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
  if (argv.yes) {
    await commitChanges(commitMessage);
    return;
  }

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
    log(chalk.yellow("Commit aborted by user."));
  }
}

function truncatePath(path: string, maxLength: number): string {
  if (path.length <= maxLength) {
    return path;
  }
  return "..." + path.slice(-maxLength + 3); // +3 for the length of '...'
}

function printFiles(
  stagedFiles: Array<{ file: string; additions: number; deletions: number }>,
  contentWidth: number,
) {
  stagedFiles.forEach(({ file, additions, deletions }) => {
    const truncatedFile = truncatePath(file, MAX_FILE_LENGTH);
    const additionText =
      additions > 0 ? chalk.greenBright(` (+${additions})`) : "";
    const deletionText =
      deletions > 0 ? chalk.redBright(` (-${deletions})`) : "";
    const fileInfo = `${truncatedFile}${additionText}${deletionText}`;
    const filePaddingLength = contentWidth - visibleLength(fileInfo);
    const filePadding = " ".repeat(Math.max(0, filePaddingLength - 1));
    log(
      chalk.blueBright("│ ") +
        chalk.yellowBright(truncatedFile) +
        additionText +
        deletionText +
        filePadding +
        chalk.blueBright("│"),
    );
  });
}

function calculateBoxValues(
  stagedFiles: Array<{ file: string; additions: number; deletions: number }>,
) {
  const header = "Staged files to be committed:";
  const maxLineLength = Math.max(
    ...stagedFiles.map(({ file, additions, deletions }) => {
      const additionText = additions > 0 ? ` (+${additions})` : "";
      const deletionText = deletions > 0 ? ` (-${deletions})` : "";
      return `${truncatePath(file, MAX_FILE_LENGTH)}${additionText}${deletionText}`
        .length;
    }),
    header.length,
  );

  const totalWidth = Math.max(50, maxLineLength + 4); // Add some padding for aesthetics
  const contentWidth = totalWidth - 2; // Account for the borders
  return { header, contentWidth };
}

function printStagedFiles(
  stagedFiles: Array<{ file: string; additions: number; deletions: number }>,
): void {
  const { header, contentWidth } = calculateBoxValues(stagedFiles);
  printBoxHeader(contentWidth, header);
  printFiles(stagedFiles, contentWidth);
  printBoxFooter(contentWidth);
}

function visibleLength(str: string): number {
  // Remove ANSI escape codes to correctly calculate the visible length
  // eslint-disable-next-line no-control-regex
  return str.replace(/\u001b\[\d+m/g, "").length;
}

function printBoxHeader(contentWidth: number, header: string): void {
  log(chalk.blueBright("┌" + "─".repeat(contentWidth) + "┐"));
  const paddingLength = Math.floor((contentWidth - visibleLength(header)) / 2);
  const remainder = (contentWidth - visibleLength(header)) % 2;
  const padding = " ".repeat(paddingLength);
  const extraPadding = " ".repeat(remainder); // Extra padding to ensure total length is even
  log(
    chalk.blueBright("│") +
      padding +
      chalk.bold(header) +
      padding +
      extraPadding +
      chalk.blueBright("│"),
  );
}

function printBoxFooter(contentWidth: number): void {
  log(chalk.blueBright("└" + "─".repeat(contentWidth) + "┘"));
}

function addAllChanges(): Promise<void> {
  return new Promise((resolve, reject) => {
    const add = spawn("git", ["add", "--all"], {
      stdio: "inherit",
    });

    add.on("close", (code) => {
      if (code === 0) {
        log(chalk.green("All changes added successfully."));
        resolve();
      } else {
        console.error(
          chalk.red(`Failed to add changes with exit code: ${code}`),
        );
        reject(new Error(`git add command failed with exit code ${code}`));
      }
    });

    add.on("error", (error) => {
      console.error(chalk.red("Failed to add changes:"), error);
      reject(error);
    });
  });
}

// Main function refactored with smaller functions
async function main() {
  if (argv.all) {
    await addAllChanges();
  }

  const diff = await getStagedGitDiff(argv.dir, argv.silent);
  const stagedFiles = await getStagedFiles(argv.dir, argv.silent);
  const context = argv._[0] as string | undefined;
  if (diff) {
    if (!argv.silent) {
      printStagedFiles(stagedFiles);
    }
    const commitMessage = await generateCommitMessage(diff, context);
    if (!argv.silent) {
      log(chalk.greenBright("Suggested commit message:"));
      log(chalk.yellowBright(commitMessage));
    }
    await handleCommit(commitMessage);
  } else {
    log(chalk.red("No staged changes found."));
    log(
      chalk.red("Tip: Add `--all/-a` to stage all changes before committing."),
    );
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red("Unexpected error:"), error);
    process.exit(1);
  });
}
