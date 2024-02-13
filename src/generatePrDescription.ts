import * as fs from "fs";
import axios from "axios";
import prompts from "prompts";
import { config } from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";
import clipboardy from "clipboardy";
import chalk from "chalk";

config(); // Load .env file

// Register SIGINT handler
process.on("SIGINT", () => {
  console.log(chalk.red("\nExiting gracefully..."));
  process.exit(0);
});

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

async function getGitDiff(destBranch: string): Promise<string> {
  try {
    // Replace `origin/main` with your `destBranch` variable
    const { stdout } = await execAsync(`git diff ${destBranch}`);
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
            content: diffContent,
          },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } },
    );

    // Assuming the API response structure matches the expected format.
    // You might need to adjust this based on the actual response format.
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error fetching PR description:", error);
    throw error; // Rethrow or handle as needed
  }
}

async function main() {
  console.log(chalk.blue("🤖 Let's prepare your PR description. 🚀"));

  const template = await findTemplate();
  let attachTemplate: prompts.Answers<string> = { value: false };

  let prompt =
    "You are a helpful assistant. Generate a detailed and structured PR description using the provided git diff.";

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

  if (attachTemplate.value && template) {
    const pullRequestTemplatePrompt = `\n\nPlease make the PR description fit this pull request template format:\n${template}`;
    prompt += pullRequestTemplatePrompt;
  }

  const diff = await getGitDiff("origin/main");
  const prDescription = await getPRDescription(prompt, diff);
  console.log(chalk.green(`\n🚀 Generated PR Description:\n`));
  console.log(prDescription);

  // Ask if the user wants to copy the response to the clipboard
  const copyToClipboard = await prompts({
    type: "toggle",
    name: "value",
    message: chalk.yellow("📋 Copy the PR description to the clipboard?"),
    initial: false,
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
