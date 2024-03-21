import fs from "fs";
import chalk from "chalk";
import prompts from "prompts";
import { CUSTOM_PROMPT_PATH } from "./generatePrDescription";
import { config } from "dotenv";
import JiraApi from "./apis/JiraApi";

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
  const jiraUsername = process.env.JIRA_USERNAME;
  const jiraApiToken = process.env.JIRA_API_TOKEN;

  if (!jiraUsername || !jiraApiToken) {
    console.log(chalk.red("JIra username or API token not found, skipping Jira ticket description."));
    return "";
  }

  const jira = new JiraApi(jiraUsername, jiraApiToken);

  // prompt user for ticket number
  const response = await prompts({
    type: "text",
    name: "ticketNumber",
    message: chalk.yellow("Enter the Jira ticket number:"),
    format: (value) => value.toUpperCase(),
  });

  if (response.ticketNumber) {
    try {
      const issue = await jira.getIssue(response.ticketNumber);
      if(issue) {
        return `\n
Below are the contents of the Jira ticket, please use it to gain more context on the changes and include a link to the card in the PR description. 
Also, please include the Jira ticket number ${issue.key} at the start of the PR title in square brackets (eg [${issue.key}]). 
      
  \`\`\`
  ${issue.description}
  \`\`\``;
      }
    } catch (err) {
      console.error(err);
    }
  }
  return "";
}

function saveCustomPrompt(prompt: string): void {
  try {
    fs.writeFileSync(CUSTOM_PROMPT_PATH, prompt, "utf8");
    console.log(chalk.green("✅  Custom prompt saved for future use."));
  } catch (error) {
    console.error(chalk.red(`Error saving custom prompt: ${error}`));
  }
}
