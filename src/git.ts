import { promisify } from "util";
import { exec } from "child_process";
import chalk from "chalk";
import ora from "ora";

const execAsync = promisify(exec);

export async function getGitDiff(
  repoDir: string,
  destBranch: string = "origin/main",
): Promise<string> {
  try {
    // Use the -C flag to specify the directory for the git command
    const { stdout } = await execAsync(
      `git -C "${repoDir}" diff ${destBranch}`,
    );

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
    const { stdout } = await execAsync(`git -C ${pathToRepo} diff --cached`);
    if (!silent) spinner.succeed(chalk.blue("Staged git diff obtained"));
    return stdout;
  } catch (error) {
    if (!silent) spinner.fail(chalk.blue("Failed to obtain staged git diff"));
    console.error(chalk.red(error));
    throw new Error("Failed to obtain staged git diff");
  }
}

export async function getStagedFiles(
  pathToRepo: string,
  silent: boolean = false,
): Promise<{ file: string; additions: number; deletions: number }[]> {
  const spinner = ora(chalk.blue("Obtaining staged files..."));
  if (!silent) spinner.start();

  try {
    const { stdout } = await execAsync(
      `git -C "${pathToRepo}" diff --cached --numstat`,
    );
    const files = stdout
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
    if (!silent) spinner.succeed(chalk.blue("Staged files obtained"));
    return files;
  } catch (error) {
    if (!silent) spinner.fail(chalk.blue("Failed to obtain staged files"));
    console.error(chalk.red(error));
    throw new Error("Failed to obtain staged files");
  }
}