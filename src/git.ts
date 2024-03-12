import chalk from "chalk";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);
const DIR_PATH = process.env.CURRENT_DIR || process.cwd();

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
      console.error(
        chalk.red(
          "❌  No git diff found. Please ensure you have changes in your branch.",
        ),
      );
      process.exit(1);
    }

    return stdout;
  } catch (error) {
    console.error("Error getting git diff:", error);
    throw error; // Rethrow or handle as needed
  }
}

export async function getStagedGitDiff(): Promise<string> {
  try {
    const { stdout } = await execAsync(`git -C ${DIR_PATH} diff --cached`);
    return stdout;
  } catch (error) {
    console.error(chalk.red("Error obtaining staged git diff:"), error);
    process.exit(1);
  }
}
