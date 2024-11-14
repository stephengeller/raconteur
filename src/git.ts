import chalk from "chalk";
import ora from "ora";
import { GitCommandExecutor, SystemGitCommandExecutor } from "./gitCommandExecutor";

// Default executor that can be overridden for testing
let gitExecutor: GitCommandExecutor = new SystemGitCommandExecutor();

// For testing purposes
export function setGitExecutor(executor: GitCommandExecutor) {
  gitExecutor = executor;
}

export async function getGitDiff(
  repoDir: string,
  destBranch: string = "origin/main",
): Promise<string> {
  try {
    const stdout = await gitExecutor.execute(`diff ${destBranch}`, repoDir);

    if (!stdout) {
      throw new Error("No git diff found. Please ensure you have changes in your branch.");
    }

    return stdout;
  } catch (error) {
    console.error("Error getting git diff:", error);
    throw error;
  }
}

export async function getStagedGitDiff(
  pathToRepo: string,
  silent: boolean = false,
): Promise<string> {
  const spinner = ora(chalk.blue("Obtaining staged git diff..."));
  if (!silent) spinner.start();
  try {
    const stdout = await gitExecutor.execute("diff --cached", pathToRepo);
    if (!silent) spinner.succeed(chalk.blue("Staged git diff obtained"));
    return stdout;
  } catch (error) {
    if (!silent) spinner.fail(chalk.blue("Failed to obtain staged git diff"));
    console.error(chalk.red(error));
    throw new Error("Failed to obtain staged git diff");
  }
}

// Pure function to parse numstat output
export function parseGitNumstat(numstatOutput: string): Array<{ file: string; additions: number; deletions: number }> {
  return numstatOutput
    .trim()
    .split("\n")
    .filter(line => line.trim())
    .map((line) => {
      const [additions, deletions, file] = line.split("\t");
      return {
        file,
        additions: parseInt(additions),
        deletions: parseInt(deletions),
      };
    });
}

export async function getStagedFiles(
  pathToRepo: string,
  silent: boolean = false,
): Promise<Array<{ file: string; additions: number; deletions: number }>> {
  const spinner = ora(chalk.blue("Obtaining staged files..."));
  if (!silent) spinner.start();

  try {
    const stdout = await gitExecutor.execute("diff --cached --numstat", pathToRepo);
    const files = parseGitNumstat(stdout);
    if (!silent) spinner.succeed(chalk.blue("Staged files obtained"));
    return files;
  } catch (error) {
    if (!silent) spinner.fail(chalk.blue("Failed to obtain staged files"));
    console.error(chalk.red(error));
    throw new Error("Failed to obtain staged files");
  }
}