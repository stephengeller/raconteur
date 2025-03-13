import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";
import prompts from "prompts";
import { loadEnv } from "./config/env";
import { getGitDiff } from "./git/gitDiff";
import { createGitHubPr } from "./github/createPr";
import { loadCustomPrompt } from "./prompts/customPrompt";
import { findTemplate } from "./prompts/templatePrompt";
import { getPRDescription } from "./utils/utils";
import { getJiraTicketDescription } from "../utils";
import { copyToClipboard } from "../copyToClipboard";
import { messages } from "../messages";
import { setupExitHandlers } from "../utils/exitHandler";

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
  .option("yes", {
    alias: "y",
    description: "Skip Jira ticket lookup",
    type: "boolean",
    default: false,
  })
  .option("create", {
    alias: "c",
    description: "Automatically create GitHub PR",
    type: "boolean",
    default: false,
  })
  .help()
  .alias("help", "h")
  .parseSync();

if (argv.branch !== DEFAULT_BRANCH) {
  console.log(chalk.yellow(`Comparing with branch ${chalk.bold(argv.branch)}`));
}

loadEnv(); // Load .env file

setupExitHandlers();

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

  if (result !== null) {
    [template] = result;
    console.log(chalk.green("📝 PR template found, using it ✅ "));
  }

  let prompt =
    loadCustomPrompt() ||
    `
You are a helpful assistant. Generate a clear, concise and structured PR description using the provided git diff. 
Use bullet-points and numbered lists where necessary and appropriate, especially when detailing changes. 
Unless the code change appears complex, please keep the PR length to an easily digestible size and reflecting the size of the changes.
    
Please also generate a PR title, following the Conventional Commit format.
    `;

  // Only add Jira ticket description if --yes flag is not set
  if (!argv.yes) {
    prompt += await getJiraTicketDescription();
  }

  if (template) {
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

  // If --create flag is set, automatically create PR
  if (argv.create) {
    try {
      await createGitHubPr(prDescription, DIR_PATH);
      return;
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red("Error creating PR:", error.message));
      } else {
        console.error(chalk.red("An unknown error occurred while creating the PR"));
      }
      
      if (!argv.yes) {
        // Only show options prompt if not in fully automated mode
        await showOptionsPrompt(prDescription);
      }
      process.exit(1);
    }
  }

  // If not creating automatically, show options
  await showOptionsPrompt(prDescription);
}

async function showOptionsPrompt(prDescription: string) {
  const { command } = await prompts({
    type: "select",
    name: "command",
    message: chalk.yellow(messages.prDescription.createPr),
    choices: [
      { title: "🆕 Create GitHub PR", value: "createPr" },
      {
        title: messages.prDescription.copyToClipboard,
        value: "copyToClipboard",
      },
      { title: "Exit", value: "exit" },
    ],
  });

  if (command === "createPr") {
    try {
      await createGitHubPr(prDescription, DIR_PATH);
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red("Error creating PR:", error.message));
      } else {
        console.error(chalk.red("An unknown error occurred while creating the PR"));
      }
      // Re-prompt the user after error
      return showOptionsPrompt(prDescription);
    }
  }

  if (command === "copyToClipboard") {
    await copyToClipboard(prDescription);
    console.log(chalk.green("✅  PR description copied to clipboard!"));
  }
}

if (require.main === module) {
  main().catch((error) => {
    if (error instanceof Error) {
      console.error(chalk.red("Error:", error.message));
    } else {
      console.error(chalk.red("An unknown error occurred"));
    }
    process.exit(1);
  });
}