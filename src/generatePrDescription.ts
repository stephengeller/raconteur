import * as fs from "fs";
import prompts from "prompts";
import { config } from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import { copyToClipboard } from "./copyToClipboard";
import { callChatGPTApi } from "./ChatGPTApi";

config(); // Load .env file

// Register SIGINT handler
process.on("SIGINT", () => {
  console.log(chalk.red("\nExiting gracefully..."));
  process.exit(0);
});

const DIR_PATH = process.env.CURRENT_DIR || process.cwd();
const CUSTOM_PROMPT_PATH = `./customPrDescriptionPrompt.txt`;

async function findTemplate(): Promise<[string, string] | null> {
  const templatePaths = [
    `${DIR_PATH}/.github/pull_request_template.md`,
    `${DIR_PATH}/pull_request_template.md`,
    `${DIR_PATH}/.github/PULL_REQUEST_TEMPLATE.md`,
    `${DIR_PATH}/PULL_REQUEST_TEMPLATE.md`,
  ];
  for (const templatePath of templatePaths) {
    if (fs.existsSync(templatePath)) {
      return [fs.readFileSync(templatePath, "utf8"), templatePath];
    }
  }
  return null;
}

function loadCustomPrompt(): string | null {
  try {
    if (fs.existsSync(CUSTOM_PROMPT_PATH)) {
      return fs.readFileSync(CUSTOM_PROMPT_PATH, "utf8");
    }
  } catch (error) {
    console.warn(
      chalk.yellow(
        `Warning: Failed to load custom prompt from ${CUSTOM_PROMPT_PATH}`,
      ),
    );
  }
  return null;
}

function saveCustomPrompt(prompt: string): void {
  try {
    fs.writeFileSync(CUSTOM_PROMPT_PATH, prompt, "utf8");
    console.log(chalk.green("✅  Custom prompt saved for future use."));
  } catch (error) {
    console.error(chalk.red(`Error saving custom prompt: ${error}`));
  }
}

const execAsync = promisify(exec);

async function getGitDiff(
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

async function getPRDescription(
  systemContent: string,
  diffContent: string,
): Promise<string> {
  console.log(chalk.blue("🤖 Generating PR description..."));
  return await callChatGPTApi(systemContent, diffContent);
}

async function main() {
  const diff = await getGitDiff(DIR_PATH, "origin/main");

  if (!DIR_PATH) {
    console.error(
      chalk.red(
        "❌ Environment variable CURRENT_DIR is not set. Please run this script in a git repository.",
      ),
    );
    process.exit(1);
  }

  console.log(chalk.blue("🤖 Let's prepare your PR description. 🚀"));

  const result = await findTemplate();
  let template, templatePath;

  if (result !== null) {
    [template, templatePath] = result;
  }

  let attachTemplate: prompts.Answers<string> = { value: false };

  if (template) {
    attachTemplate = await prompts({
      type: "toggle",
      name: "value",
      active: "yes",
      inactive: "no",
      message: chalk.yellow(
        `📄 PR template found at ${chalk.yellow(templatePath)} - apply it to the description?`,
      ),
      initial: true,
    });
  }

  let prompt =
    loadCustomPrompt() ||
    `You are a helpful assistant. Generate a clear, concise and structured PR description using the provided git diff. 
    Use bullet-points and numbered lists where necessary and appropriate, especially when detailing changes.`;

  console.log(
    chalk.blue(`Here's the prompt so far:\n\t${chalk.green(prompt)}`),
  );

  const customPrompt = await prompts({
    type: "toggle",
    name: "value",
    message: chalk.yellow("✏️ Do you want to re-write the prompt?"),
    initial: false,
    active: "yes",
    inactive: "no",
  });

  if (customPrompt.value) {
    const response = await prompts({
      type: "text",
      name: "value",
      message: chalk.cyan("📝 Enter your custom prompt:"),
    });
    prompt = response.value;
    saveCustomPrompt(prompt);
  }

  const extraContextPrompt = await prompts({
    type: "toggle",
    name: "value",
    message: chalk.yellow("✏️ Do you want to add any context to the prompt?"),
    initial: false,
    active: "yes",
    inactive: "no",
  });

  if (extraContextPrompt.value) {
    const response = await prompts({
      type: "text",
      name: "value",
      message: chalk.cyan("📝 Enter your extra context:"),
    });
    prompt += response.value;
  }

  if (attachTemplate.value && template) {
    const pullRequestTemplatePrompt = `
    
    Please make the PR description fit this pull request template format:\n${template}`;
    prompt += pullRequestTemplatePrompt;
  } else {
    prompt += `Unless you believe there's a better one, the description structure is as follows:
    ## What (if applied, this commit will)
    ## Why (A clear explanation of why this change is necessary)
    ## Testing (The best way to verify the implementation)`;
  }

  const prDescription = await getPRDescription(prompt, diff);
  console.log(chalk.green(`\n🚀 Generated PR Description:\n`));
  console.log(prDescription);

  // Ask if the user wants to copy the response to the clipboard
  const copyToClipboardPrompt = await prompts({
    type: "toggle",
    name: "value",
    message: chalk.yellow("📋 Copy the PR description to the clipboard?"),
    initial: true,
    active: "yes",
    inactive: "no",
  });

  if (copyToClipboardPrompt.value) {
    await copyToClipboard(prDescription);
    console.log(chalk.green("✅  PR description copied to clipboard!"));
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  console.error(error);
  process.exit(1);
});
