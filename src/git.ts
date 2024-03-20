import chalk from "chalk";
import { promisify } from "util";
import { exec } from "child_process";

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

export async function getStagedGitDiff(pathToRepo: string): Promise<string> {
  console.log(chalk.blue("Obtaining staged git diff..."));
  try {
    const { stdout } = await execAsync(`git -C ${pathToRepo} diff --cached`);
    return stdout;
  } catch (error) {
    console.error(chalk.red("Error obtaining staged git diff:"), error);
    process.exit(1);
  }
}
