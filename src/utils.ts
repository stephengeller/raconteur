import fs from "fs";
import chalk from "chalk";
import prompts from "prompts";
import { CUSTOM_PROMPT_PATH } from "./generatePrDescription";
import { config } from "dotenv";
import JiraApi, { JiraIssue } from "./apis/JiraApi";

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

async function getJiraPrompts(jiraApi: JiraApi):  Promise<JiraIssue | undefined> {
  let { command } = await prompts({
    type: "select",
    name: "command",
    message: chalk.yellow("✏️ Do you want to add a Jira ticket description?"),
    choices: [
      { title: "Fetch my open tickets", value: "fetch" },
      { title: "Enter manually", value: "enter" },
      { title: "No", value: "no" },
    ],
  });

  if (command === "fetch") {
    const issues = await jiraApi.getUserIssues();
    const issueChoices = issues.map((issue) => ({
      title: `[${issue.key}] ${issue.summary}`,
      value: issue,
    }));

    const { selectedIssue } = await prompts({
      type: "autocomplete",
      name: "selectedIssue",
      message: chalk.yellow("Select the Jira ticket to include in the PR description:"),
      choices: [
        ...issueChoices,
        { title: "None", value: "none" },
        { title: "Enter Manually", value: "enter" },
      ],
      suggest: async (input, choices) => {
        const lowercaseInput = input.toLowerCase();
        // Always show the "None" and "Enter Manually" options, all others should be filtered by title.
        return choices.filter(({ value, title }) => 
          value === "none" 
          || value === "enter" 
          || title.toLowerCase().includes(lowercaseInput)
        );
      }
    });

    if (selectedIssue === "none" || selectedIssue === "enter") {
      command = selectedIssue;
    }
  }
  
  if (command === "enter") {
    const { ticket } = await prompts({
      type: "text",
      name: "ticket",
      message: chalk.cyan("Enter the Jira ticket number:"),
    });

    return jiraApi.getIssue(ticket);
  }

  return undefined;
}


export async function getJiraTicketDescription(): Promise<string> {
  const jiraUsername = process.env.SQAUREUP_EMAIL;
  const jiraApiToken = process.env.JIRA_API_TOKEN;

  if (!jiraUsername || !jiraApiToken) {
    console.log(chalk.red("Jira username or API token not found, skipping Jira ticket description."));
    return "";
  }

  const jira = new JiraApi(jiraUsername, jiraApiToken);

  try {
  const issue = await getJiraPrompts(jira);

    if(issue) {
      return `
Below are the contents of the Jira ticket, please use it to gain more context on the changes and include a link to the card in the PR description.
Also, please include the Jira ticket number ${issue.key} at the start of the PR title in square brackets (eg [${issue.key}]).

\`\`\`
${issue.summary}

${issue.description}
\`\`\`
`;
    }
  } catch (error) {
    console.error(chalk.red(`Error fetching Jira ticket: ${error}`));
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
