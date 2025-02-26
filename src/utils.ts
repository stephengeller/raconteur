import fs from "fs";
import chalk from "chalk";
import prompts from "prompts";
import { config } from "dotenv";
import JiraApi, { JiraIssue } from "./apis/JiraApi";
import { CUSTOM_PROMPT_PATH } from "./prDescriptionGenerator/prompts/customPrompt";
import { messages } from "./messages";

config(); // Load .env file



async function getJiraPrompts(
  jiraApi: JiraApi,
): Promise<JiraIssue | undefined> {
  let command = "fetch";

  if (command === "fetch") {
    const issues = await jiraApi.getUserIssues();
    const issueChoices = issues.map((issue) => ({
      title: `[${issue.key}] ${issue.summary}`,
      value: issue,
    }));

    const { selectedIssue } = await prompts({
      type: "autocomplete",
      name: "selectedIssue",
      message: messages.prDescription.selectJiraTicket,
      choices: [
        ...issueChoices,
        { title: "None", value: "none" },
        { title: "Enter Manually", value: "enter" },
      ],
      suggest: async (input, choices) => {
        const lowercaseInput = input.toLowerCase();
        // Always show the "None" and "Enter Manually" options, all others should be
        // filtered by title.
        return choices.filter(
          ({ value, title }) =>
            value === "none" ||
            value === "enter" ||
            title.toLowerCase().includes(lowercaseInput),
        );
      },
    });

    if (selectedIssue?.key) {
      return jiraApi.getIssue(selectedIssue.key);
    }

    if (selectedIssue === "none" || selectedIssue === "enter") {
      command = selectedIssue;
    }
  }

  if (command === "enter") {
    const { ticket } = await prompts({
      type: "text",
      name: "ticket",
      message: messages.prDescription.enterJiraTicket,
    });

    return jiraApi.getIssue(ticket);
  }

  return undefined;
}

export async function getJiraTicketDescription(): Promise<string> {
  const jiraUsername = process.env.SQUAREUP_EMAIL;
  const jiraApiToken = process.env.JIRA_API_TOKEN;

  if (!jiraUsername || !jiraApiToken) {
    console.log(
      chalk.red(
        "Jira username or API token not found, skipping Jira ticket description.",
      ),
    );
    return "";
  }

  const jira = new JiraApi(jiraUsername, jiraApiToken);

  try {
    const issue = await getJiraPrompts(jira);

    if (issue) {
      return `
Below are the contents of the Jira ticket for this task, please use it to gain more context on the changes and include a link to the card in the PR description.
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
