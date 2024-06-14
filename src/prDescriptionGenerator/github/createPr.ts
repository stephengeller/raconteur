import { Octokit } from "@octokit/rest";
import { execSync } from "node:child_process";
import chalk from "chalk";
import ora from "ora";

export async function createGitHubPr(prDescription: string, dirPath: string) {
  const TOKEN = process.env.GITHUB_TOKEN; // Make sure you have your GitHub token set in environment variables

  if (!TOKEN) {
    throw new Error("GitHub token is not set in the environment variables");
  }

  const octokit = new Octokit({ auth: TOKEN });

  // Extract PR title from prDescription
  const branchName = execSync("git rev-parse --abbrev-ref HEAD", {
    cwd: dirPath,
  })
    .toString()
    .trim();

  const title = extractConventionalCommitTitle(prDescription, branchName);

  const repoInfo = execSync("git config --get remote.origin.url", {
    cwd: dirPath,
  })
    .toString()
    .trim()
    .match(/github\.com[:/](.+)\/(.+)\.git$/);

  if (!repoInfo) {
    throw new Error("Could not determine repository owner and name");
  }

  const owner = repoInfo[1];
  const repo = repoInfo[2];

  const spinner = ora(chalk.blue("Creating GitHub PR...")).start();

  try {
    const response = await octokit.pulls.create({
      owner,
      repo,
      head: branchName,
      base: "main",
      title,
      body: prDescription,
    });

    spinner.succeed("PR created successfully");
    console.log("PR created:", response.data.html_url);
  } catch (error) {
    spinner.fail("Failed to create PR");
    console.error(chalk.red("Failed to create PR:"), error);
    throw error;
  }
}

export function extractConventionalCommitTitle(
  prDescription: string,
  defaultTitle: string,
): string {
  const conventionalCommitTypes = [
    "feat",
    "fix",
    "chore",
    "docs",
    "style",
    "refactor",
    "perf",
    "test",
  ];
  let title = defaultTitle; // Default to branch name if no match is found

  const lines = prDescription.split("\n");
  for (const line of lines) {
    for (const type of conventionalCommitTypes) {
      const regex = new RegExp(`.*(${type}:.*)`);
      const match = line.match(regex);
      if (match && match[1]) {
        title = match[1].trim().replace(/\W+$/, ""); // Remove trailing non-alphanumeric characters
        break;
      }
    }
    if (title !== defaultTitle) {
      break;
    }
  }

  return title;
}
