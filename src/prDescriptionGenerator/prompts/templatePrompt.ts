import * as fs from "fs";
import * as path from "path";
import prompts from "prompts";
import chalk from "chalk";
import { execSync } from "child_process";

function getGitRoot(dirPath: string): string | null {
  try {
    return execSync('git rev-parse --show-toplevel', { 
      cwd: dirPath,
      encoding: 'utf-8'
    }).trim();
  } catch (error) {
    return null;
  }
}

export async function findTemplate(
  dirPath: string,
): Promise<[string, string] | null> {
  const gitRoot = getGitRoot(dirPath);
  
  if (!gitRoot) {
    console.log(chalk.yellow("⚠️  Warning: Not in a git repository. Cannot search for PR template."));
    return null;
  }

  if (gitRoot !== dirPath) {
    console.log(chalk.yellow(`⚠️  Warning: Current directory (${dirPath}) is not the root of the git repository.`));
    console.log(chalk.yellow(`    PR template search may fail. Repository root is: ${gitRoot}`));
  }

  const templatePaths = [
    `${dirPath}/.github/pull_request_template.md`,
    `${dirPath}/pull_request_template.md`,
    `${dirPath}/.github/PULL_REQUEST_TEMPLATE.md`,
    `${dirPath}/PULL_REQUEST_TEMPLATE.md`,
  ];
  for (const templatePath of templatePaths) {
    if (fs.existsSync(templatePath)) {
      return [fs.readFileSync(templatePath, "utf8"), templatePath];
    }
  }
  return null;
}

export async function attachTemplatePrompt(
  templatePath: string,
): Promise<boolean> {
  // Convert absolute path to relative path from the repo root
  const relativePath = path.relative(process.cwd(), templatePath);
  
  const response = await prompts({
    type: "toggle",
    name: "value",
    active: "yes",
    inactive: "no",
    message: chalk.yellow(
      `📄 PR template found at ${chalk.yellow(relativePath)} - apply it to the description?`,
    ),
    initial: true,
  });

  return response.value;
}
