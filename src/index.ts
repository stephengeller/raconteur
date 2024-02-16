import { Octokit } from "@octokit/rest";
import moment from "moment";
import * as fs from "fs";
import dotenv from "dotenv";
import chalk from "chalk";
import prompts from "prompts";
import { callChatGPTApi } from "./ChatGPTApi";
import { copyToClipboard } from "./copyToClipboard";

dotenv.config();

// Register SIGINT handler
process.on("SIGINT", () => {
  console.log(chalk.red("\nExiting gracefully..."));
  process.exit(0);
});

interface PullRequest {
  title: string;
  html_url: string;
  closed_at: string;
}

let PROMPT = `
Please create a short, concise summary of each of the following PRs, so that I can put it in my hypedoc to reference in the future.

It should:
- Emphasise the impact and benefits
- Be clear and concise
- Have a URL of the PR at the end of the line in brackets so I can click through to the PR (NOT a hyperlink, just the URL on its own)
- Be in reverse chronological order (most recent first)
- Be in plaintext, not markdown

Please follow the following example as a reference for desired format:
Feb 10, 2024:
- Successfully led the development of Project X's core module, improving system efficiency by 20%.
- Initiated and completed a code refactoring for the Legacy System, enhancing maintainability.
- Collaborated on the Integration Initiative, ensuring seamless connection between System A and B.
- Acted as the interim lead for the Deployment Team during critical release phases.

Jan 25, 2024:
- Spearheaded the documentation overhaul for Project Y, setting a new standard for project clarity.
- Managed cross-departmental teams to kickstart the Beta Launch of the New Platform.
- Coordinated with the Design Team to implement a new UI/UX for the Customer Portal.
`;

class PRSummarizer {
  private octokit: Octokit;
  private username: string | undefined;
  private sinceDate: string;

  constructor() {
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.username = process.env.GITHUB_USERNAME;
    // Initialize sinceDate with a temporary value, will be updated based on user input
    this.sinceDate = moment().format();
  }

  private async setSinceDate(): Promise<void> {
    const defaultWeeks = 2;
    const response = await prompts({
      type: "number",
      name: "value",
      message: chalk.yellow("How many weeks ago should PRs be fetched from?"),
      initial: 2,
      // validate: (value) =>
      // value < 1 ? `Please enter a positive number.` : true,
    });

    this.sinceDate = moment()
      .subtract(response.value || defaultWeeks, "weeks")
      .format();
  }

  private async fetchMergedPRs(): Promise<PullRequest[] | undefined> {
    if (!this.username) {
      throw new Error("GitHub username is not set in environment variables.");
    }

    const searchResponse = await this.octokit.search.issuesAndPullRequests({
      q: `is:pr author:${this.username} is:merged`,
      sort: "created",
      order: "desc",
      per_page: 100,
    });

    return searchResponse.data.items.filter((pr) =>
      moment(pr.closed_at).isAfter(this.sinceDate),
    ) as PullRequest[] | undefined;
  }

  private async summarizePRs(prs: PullRequest[]): Promise<string | undefined> {
    // Convert PRs to a format suitable for prompts
    const choices = prs.map((pr, index) => ({
      title: `${pr.title} (merged ${moment(pr.closed_at).format("Do MMM YYYY")})`,
      value: index,
      selected: true,
    }));

    const response = await prompts({
      type: "multiselect",
      name: "selectedPRs",
      message: chalk.yellow("Select PRs to fetch summaries for:"),
      choices,
      // hint: "- Space to select. Return to submit",
    });

    // Filter PRs based on selected indices
    const selectedPRs = response.selectedPRs.map((index: number) => prs[index]);

    if (selectedPRs.length === 0) {
      console.log(chalk.yellow("No PRs selected for summarization."));
      return;
    }

    // Proceed with summarization for selected PRs
    const prsData: string = JSON.stringify(selectedPRs);
    const tempFilePath: string = "./temp_prs_data.json";
    fs.writeFileSync(tempFilePath, prsData);

    console.log(chalk.blue(`Here's the prompt so far:\n\n${PROMPT}`));

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
      PROMPT += response.value;
    }

    try {
      const hypedocSummaries = await callChatGPTApi(PROMPT, prsData);
      console.log(chalk.green("🚀 Hypedoc summaries generated:\n\n"));
      console.log(hypedocSummaries);
      fs.unlinkSync(tempFilePath);
      return hypedocSummaries;
    } catch (error) {
      console.error(chalk.red(`Error executing command: ${error}`));
    }
  }

  public async run(): Promise<void> {
    console.log(chalk.cyan("Fetching merged PRs..."));
    await this.setSinceDate();
    try {
      const prs = await this.fetchMergedPRs();

      if (!prs || prs.length === 0) {
        console.log(
          chalk.yellow(
            "No PRs found for the specified duration. Have you authorized squareup for your personal access token?",
          ),
        );
        return;
      }

      console.log(chalk.blue(`Found [${prs.length}] pull requests...`));
      const summaries = await this.summarizePRs(prs);

      // Ask if the user wants to copy the response to the clipboard
      const copyToClipboardPrompt = await prompts({
        type: "toggle",
        name: "value",
        message: chalk.yellow("📋 Copy the PR description to the clipboard?"),
        initial: true,
        active: "yes",
        inactive: "no",
      });

      if (copyToClipboardPrompt.value && summaries) {
        await copyToClipboard(summaries);
        console.log(chalk.green("✅  PR description copied to clipboard!"));
      }
    } catch (error) {
      console.error(chalk.red(`Failed to process PRs: ${error}`));
    }
  }
}

const summarizer = new PRSummarizer();
summarizer.run();
