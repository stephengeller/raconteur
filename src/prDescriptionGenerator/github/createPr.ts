import { execSync } from "child_process";
import { Octokit } from "@octokit/rest";
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

function checkGitStatus(dirPath: string) {
  // Check if we're on main branch
  const currentBranch = getBranchName(dirPath);
  if (currentBranch === "main") {
    throw new Error("Cannot create PR from main branch. Please switch to a feature branch.");
  }

  // Check if there are uncommitted changes
  try {
    const status = execSync("git status --porcelain", {
      cwd: dirPath,
    }).toString();

    if (status) {
      throw new Error("You have uncommitted changes. Please commit or stash them first.");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to check git status");
  }

  // Check if current branch exists on remote
  try {
    execSync(`git ls-remote --heads origin ${currentBranch}`, {
      cwd: dirPath,
    });
  } catch (error) {
    throw new Error(`Branch ${currentBranch} has not been pushed to remote. Please push it first with: git push -u origin ${currentBranch}`);
  }

  // Check if there are commits between current branch and main
  try {
    const commits = execSync(`git rev-list HEAD ^origin/main --count`, {
      cwd: dirPath,
    }).toString().trim();

    if (commits === "0") {
      throw new Error("No commits found between current branch and main. Make sure you have committed and pushed your changes.");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to check commit differences");
  }
}

export async function createGitHubPr(prDescription: string, dirPath: string) {
  const spinner = ora(chalk.blue("Creating GitHub PR...")).start();

  try {
    // Make sure you have your GitHub token set in environment variables
    if (!process.env.GITHUB_TOKEN) {
      throw new Error("GitHub token is not set in the environment variables");
    }

    // Run all git status checks first
    checkGitStatus(dirPath);

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
  } catch (error) {
    spinner.fail(chalk.red(`Failed to create PR.`));
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
  let lastTicketPrefix = ""; // Keep track of the last seen ticket prefix

  const lines = prDescription.split("\n");
  
  for (const line of lines) {
    let ticketPrefix = "";
    let commitMessage = "";
    
    // Look for ticket references anywhere in the line
    const ticketMatches = Array.from(line.matchAll(/\[.*?\]/g));
    if (ticketMatches.length > 0) {
      ticketPrefix = ticketMatches.map((match) => match[0]).join("");
      lastTicketPrefix = ticketPrefix; // Update last seen ticket prefix
    }
    
    // Handle PR Title section with any number of # prefixes
    const titleMatch = line.trim().match(/^#+\s*PR Title:\s*(.*)/i);
    if (titleMatch) {
      const titleContent = titleMatch[1].trim();
      for (const type of conventionalCommitTypes) {
        if (titleContent.startsWith(`${type}:`)) {
          return titleContent;
        }
      }
      continue;
    }
    
    // Look for conventional commit message in the same line or after tickets
    const lineWithoutTickets = line.replace(/\[.*?\]/g, "").trim();
    for (const type of conventionalCommitTypes) {
      const regex = new RegExp(`^\\s*(${type}:.*)`);
      const match = lineWithoutTickets.match(regex);
      if (match && match[1]) {
        commitMessage = match[1].trim().replace(/\W+$/, "");
        // Use ticket prefix from current line or last seen ticket prefix
        const prefix = ticketPrefix || lastTicketPrefix;
        title = prefix ? `${prefix} ${commitMessage}` : commitMessage;
        return title; // Return immediately when we find a valid commit message
      }
    }
  }

  return title;
}