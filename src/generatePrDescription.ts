import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import prompts from "prompts";
import { config } from "dotenv";

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

async function getPRDescription(prompt: string): Promise<string> {
  const response = await axios.post(
    "https://api.openai.com/v1/completions",
    {
      prompt,
      model: "text-davinci-003", // Update to the latest model you're using
      temperature: 0.7,
      max_tokens: 2048,
    },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } },
  );

  return response.data.choices[0].text.trim();
}

async function main() {
  const template = await findTemplate();

  let systemContent =
    "You are a helpful assistant. Generate a detailed and structured PR description using the provided git diff.";

  if (template) {
    const attachTemplate = await prompts({
      type: "confirm",
      name: "value",
      message: "Do you want to attach the PR template to the prompt?",
      initial: true,
    });

    if (attachTemplate.value) {
      systemContent += `\n\nPlease make the PR description fit this pull request template format:\n${template}`;
    }
  }

  console.log(`Generated Prompt:\n${systemContent}`);

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
    systemContent = response.value;
  }

  const prDescription = await getPRDescription(systemContent);
  console.log(`\nGenerated PR Description:\n${prDescription}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
