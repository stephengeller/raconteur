import * as fs from "fs";
import axios from "axios";
import prompts from "prompts";
import { config } from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";

config(); // Load .env file

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
      message: "PR template found for this repo - apply it to the description?",
      initial: true,
    });
  }

  console.log(`Here is the prompt so far:\n\n${prompt}\n`);

  const customPrompt = await prompts({
    type: "toggle",
    name: "value",
    message: "Do you want to modify the prompt?",
    initial: false,
    active: "yes",
    inactive: "no",
  });

  if (customPrompt.value) {
    const response = await prompts({
      type: "text",
      name: "value",
      message: "Enter your custom prompt:",
    });
    prompt = response.value;
  }

  if (attachTemplate.value) {
    const pullRequestTemplatePrompt = `\n\nPlease make the PR description fit this pull request template format:\n${template}`;
    prompt += pullRequestTemplatePrompt;
  }

  const diff = await getGitDiff("origin/main");
  const prDescription = await getPRDescription(prompt, diff);
  console.log(`\nGenerated PR Description:\n${prDescription}`);
}

main().catch((error) => {
  console.error("Error:", error.message);
  console.error(error);
  process.exit(1);
});
