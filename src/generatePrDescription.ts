import * as fs from "fs";
import prompts from "prompts";
import {config} from "dotenv";
import {exec} from "child_process";
import {promisify} from "util";
import clipboardy from "clipboardy";
import chalk from "chalk";
import axios from "axios";

config(); // Load .env file

// Register SIGINT handler
process.on("SIGINT", () => {
  console.log(chalk.red("\nExiting gracefully..."));
  process.exit(0);
})

export async function callChatGPTApi(
    systemContent: string,
    userContent: string,
): Promise<string> {
  try {
    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4-0125-preview", // Ensure this is the correct model identifier
          messages: [
            {
              role: "system",
              content: systemContent,
            },
            {
              role: "user",
              content: userContent,
            },
          ],
        },
        { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } },
    );

    // Assuming the API response structure matches the expected format.
    // You might need to adjust this based on the actual response format.
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling ChatGPT API:", error);
    throw error; // Rethrow or handle as needed
  }
}


async function findTemplate(): Promise<string | null> {
  const templatePaths = [
    ".github/pull_request_template.md",
    ".github/PULL_REQUEST_TEMPLATE.md",
  ];
  for (const templatePath of templatePaths) {
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, "utf8");
    }
  }
  return null;
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
  try {
    console.log(chalk.blue("🤖 Generating PR description..."));
    return await callChatGPTApi(systemContent, diffContent);
}

async function main() {
  const repoDir = process.env.CURRENT_DIR || process.cwd();
  const diff = await getGitDiff(repoDir, "origin/main");

  console.log(`Operating in directory: ${repoDir}`);
  if (!repoDir) {
    console.error(
      chalk.red(
        "❌ Environment variable CURRENT_DIR is not set. Please run this script in a git repository.",
      ),
    );
    process.exit(1);
  }

  console.log(chalk.blue("🤖 Let's prepare your PR description. 🚀"));

  const template = await findTemplate();
  let attachTemplate: prompts.Answers<string> = { value: false };

  let prompt = `
    You are a helpful assistant. Generate a clear, concise and structured PR description using the provided git diff. 
    Use bullet-points and numbered lists where necessary and appropriate, especially when detailing changes.
    Unless you believe there's a better one, the default description structure is as follows:
    ## What (if applied, this commit will)
    ## Why (A clear explanation of why this change is necessary)
    ## Testing (The best way to verify the implementation)
    `;

  if (template) {
    attachTemplate = await prompts({
      type: "toggle",
      name: "value",
      active: "yes",
      inactive: "no",
      message: chalk.yellow(
        "📄 PR template found - apply it to the description?",
      ),
      initial: true,
    });
  }

  console.log(chalk.blue(`Here's the prompt so far:\n\n${prompt}`));

  const customPrompt = await prompts({
    type: "toggle",
    name: "value",
    message: chalk.yellow("✏️ Do you want to customize the prompt?"),
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
  }

  const extraContextPrompt = await prompts({
    type: "toggle",
    name: "value",
    message: chalk.yellow("✏️ Do you want to add any context to the prompt?"),
    initial: false,
    active: "yes",
    inactive: "no",
    hint: "What's the context of this PR?",
    instructions:
      "This could be a summary of the changes or any additional context.",
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
    const pullRequestTemplatePrompt = `\n\nPlease make the PR description fit this pull request template format:\n${template}`;
    prompt += pullRequestTemplatePrompt;
  }

  const prDescription = await getPRDescription(prompt, diff);
  console.log(chalk.green(`\n🚀 Generated PR Description:\n`));
  console.log(prDescription);

  // Ask if the user wants to copy the response to the clipboard
  const copyToClipboard = await prompts({
    type: "toggle",
    name: "value",
    message: chalk.yellow("📋 Copy the PR description to the clipboard?"),
    initial: true,
    active: "yes",
    inactive: "no",
  });

  if (copyToClipboard.value) {
    clipboardy.writeSync(prDescription);
    console.log(chalk.green("✅  PR description copied to clipboard!"));
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  console.error(error);
  process.exit(1);
});
