import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";
import prompts from "prompts";
import { loadEnv } from "./config/env";
import { getGitDiff } from "./git/gitDiff";
import { createGitHubPr } from "./github/createPr";
import { loadCustomPrompt } from "./prompts/customPrompt";
import { findTemplate, attachTemplatePrompt } from "./prompts/templatePrompt";
import { getPRDescription } from "./utils/utils";
import {
  extraContextPrompt,
  getJiraTicketDescription,
  maybeRewritePrompt,
} from "../utils";
import { copyToClipboard } from "../copyToClipboard";
import { messages } from "../messages";

const DEFAULT_BRANCH = "main";

// Parse arguments
const argv = yargs(hideBin(process.argv))
  .option("branch", {
    alias: "b",
    description: "Specify the branch to compare with",
    type: "string",
    default: "main",
  })
  .option("dir", {
    alias: "d",
    description: "Specify the directory of the git repository",
    type: "string",
    default: process.cwd(),
  })
  .help()
  .alias("help", "h")
  .parseSync();

if (argv.branch !== DEFAULT_BRANCH) {
  console.log(chalk.yellow(`Comparing with branch ${chalk.bold(argv.branch)}`));
}

loadEnv(); // Load .env file

// Register SIGINT handler
process.on("SIGINT", () => {
  console.log(chalk.red("\nExiting gracefully..."));
  process.exit(0);
});

const DIR_PATH = argv.dir;

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

  const result = await findTemplate(DIR_PATH);
  let template: string | undefined;
  let templatePath: string | undefined;

  if (result !== null) {
    [template, templatePath] = result;
  }

  let attachTemplate = false;

  if (template && templatePath) {
    attachTemplate = await attachTemplatePrompt(templatePath);
  }

  let prompt =
    loadCustomPrompt() ||
    `
You are a helpful assistant. Generate a clear, concise and structured PR description using the provided git diff. 
Use bullet-points and numbered lists where necessary and appropriate, especially when detailing changes. 
Unless the code change appears complex, please keep the PR length to an easily digestible size and reflecting the size of the changes.
    
Please also generate a PR title, following the Conventional Commit format.
    `;

  console.log(
    chalk.blue(`Here's the prompt so far:\n\n${chalk.green(prompt)}`),
  );

  prompt = await maybeRewritePrompt(prompt);
  prompt += await getJiraTicketDescription();
  prompt += await extraContextPrompt();

  console.log(
    chalk.blue(`Here's the prompt so far:\n\n${chalk.green(prompt)}`),
  );

  if (attachTemplate && template) {
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
  const createPrPrompt = await prompts({
    type: "toggle",
    name: "value",
    message: messages.createPr,
    initial: true,
    active: "yes",
    inactive: "no",
  });

  if (createPrPrompt.value) {
    await createGitHubPr(prDescription, DIR_PATH);
  } else {
    // Ask if the user wants to copy the response to the clipboard
    const copyToClipboardPrompt = await prompts({
      type: "toggle",
      name: "value",
      message: messages.copyToClipboard,
      initial: true,
      active: "yes",
      inactive: "no",
    });

    if (copyToClipboardPrompt.value) {
      await copyToClipboard(prDescription);
      console.log(chalk.green("✅  PR description copied to clipboard!"));
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red("Error:", error.message));
    process.exit(1);
  });
}
