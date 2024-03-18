import fs from "fs";
import chalk from "chalk";
import prompts from "prompts";
import JiraApi from "jira-client";
import { CUSTOM_PROMPT_PATH } from "./generatePrDescription";
import { config } from "dotenv";

config(); // Load .env file

export async function maybeRewritePrompt(inputPrompt: string): Promise<string> {
  let finalPrompt = null;
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
    finalPrompt = response.value;
    saveCustomPrompt(finalPrompt);
  }

  return finalPrompt ?? inputPrompt;
}

export async function extraContextPrompt(): Promise<string> {
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
    return `\nHere's some extra context: ${response.value}`;
  } else {
    return "";
  }
}

export async function getJiraTicketDescription(): Promise<string> {
  const jira = new JiraApi({
    protocol: "https",
    host: "block.atlassian.net",
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_API_TOKEN,
    apiVersion: "2",
    strictSSL: true,
  });

  // prompt user for ticket number
  const response = await prompts({
    type: "text",
    name: "value",
    message: chalk.yellow("Enter the Jira ticket number:"),
  });

  if (response.value) {
    // ES7
    try {
      const issue = await jira.findIssue(response.value);
      const description = issue.fields.description;
      console.log(issue);
      return `\n\nHere are the contents of the Jira ticket, please use it to gain more context on the changes: \n${description}`;
    } catch (err) {
      console.error(err);
      return "";
    }
  } else {
    return "";
  }
}

function saveCustomPrompt(prompt: string): void {
  try {
    fs.writeFileSync(CUSTOM_PROMPT_PATH, prompt, "utf8");
    console.log(chalk.green("✅  Custom prompt saved for future use."));
  } catch (error) {
    console.error(chalk.red(`Error saving custom prompt: ${error}`));
  }
}
