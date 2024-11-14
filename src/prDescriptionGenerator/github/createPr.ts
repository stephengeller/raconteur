import { Octokit } from "@octokit/rest";
import { execSync } from "node:child_process";
import chalk from "chalk";
import ora from "ora";

function getBranchName(dirPath: string) {
  return execSync("git rev-parse --abbrev-ref HEAD", {
    cwd: dirPath,
  })
    .toString()
    .trim();
}

function getOwnerAndRepo(dirPath: string) {
  const repoInfo = execSync("git config --get remote.origin.url", {
    cwd: dirPath,
  })
    .toString()
    .trim()
    .match(/github\.com[:/](.+)\/(.+)\.git$/);

  const owner = repoInfo?.[1];
  const repo = repoInfo?.[2];
  return { owner, repo };
}

export async function createGitHubPr(prDescription: string, dirPath: string) {
  const spinner = ora(chalk.blue("Creating GitHub PR...")).start();

  // Make sure you have your GitHub token set in environment variables
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GitHub token is not set in the environment variables");
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  // Extract PR title from prDescription
  const title = extractConventionalCommitTitle(
    prDescription,
    getBranchName(dirPath),
  );

  const { owner, repo } = getOwnerAndRepo(dirPath);
  if (!owner || !repo) {
    throw new Error("Could not determine repository owner and name");
  }

  // remove the entire line that contains the title from the prDescription
  const prDescriptionWithoutTitle = prDescription.replace(title, "").trim();

  try {
    const response = await octokit.pulls.create({
      owner,
      repo,
      head: getBranchName(dirPath),
      base: "main",
      title,
      body: prDescriptionWithoutTitle,
      draft: true,
    });

    spinner.succeed(`PR created successfully: ${response.data.html_url}`);
    // open the PR in the browser
    execSync(`open ${response.data.html_url}`);
  } catch (error: any) {
    spinner.fail("Failed to create PR");
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
  let ticketPrefix = '';
  let commitMessage = '';

  for (const line of lines) {
    // First collect all ticket references at the start of the line
    const ticketMatches = Array.from(line.matchAll(/\[.*?\]/g));
    if (ticketMatches.length > 0 && line.trim().startsWith('[')) {
      ticketPrefix = ticketMatches.map(match => match[0]).join('');
      continue; // Skip to next line after collecting ticket references
    }

    // Then look for conventional commit message
    for (const type of conventionalCommitTypes) {
      const regex = new RegExp(`.*?(${type}:.*)`);
      const match = line.match(regex);
      if (match && match[1]) {
        commitMessage = match[1].trim().replace(/\W+$/, "");
        break;
      }
    }
    
    // If we found a commit message, construct the title and break
    if (commitMessage) {
      title = ticketPrefix ? `${ticketPrefix} ${commitMessage}` : commitMessage;
      break;
    }
  }

  return title;
}
