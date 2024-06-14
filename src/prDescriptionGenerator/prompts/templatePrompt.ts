import * as fs from "fs";
import path from "path";
import prompts from "prompts";
import chalk from "chalk";

export async function findTemplate(dirPath: string): Promise<[string, string] | null> {
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

export async function attachTemplatePrompt(templatePath: string): Promise<boolean> {
  const response = await prompts({
    type: "toggle",
    name: "value",
    active: "yes",
    inactive: "no",
    message: chalk.yellow(`📄 PR template found at ${chalk.yellow(templatePath)} - apply it to the description?`),
    initial: true,
  });

  return response.value;
}
