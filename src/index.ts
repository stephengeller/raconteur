import { Octokit } from "@octokit/rest";
import moment from "moment";
import * as fs from "fs";
import dotenv from "dotenv";
import chalk from "chalk";
import prompts from "prompts";
import { callChatGPTApi } from "./ChatGPTApi";
import { copyToClipboard } from "./copyToClipboard";
import { exec } from "child_process";
import { messages } from "./messages";
import { loadCustomPrompt } from "./prDescriptionGenerator/prompts/customPrompt";
import path from "path";

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
  repository_url: string;
  number: number;
}

const DEFAULT_PROMPT = `
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
    const defaultWeeks = 1;
    const response = await prompts({
      type: "number",
      name: "value",
      message: chalk.yellow("How many weeks ago should PRs be fetched from?"),
      initial: defaultWeeks,
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
    const choices = prs
      .sort((a, b) => moment(b.closed_at).diff(moment(a.closed_at)))
      .map((pr, index) => {
        const repo = pr.repository_url.split("/").pop();
        return {
          title: `[${repo} #${pr.number}] ${pr.title} (merged ${moment(pr.closed_at).format("Do MMM YYYY")})`,
          value: index,
          selected: true,
        };
      });

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

    let prompt =
      loadCustomPrompt(path.resolve(`./customRaconteurPrompt.txt`)) ||
      DEFAULT_PROMPT;

    console.log(chalk.blue(`Here's the prompt so far:\n\n${prompt}`));

    const extraContextPrompt = await prompts({
      type: "toggle",
      name: "value",
      message: messages.addContext,
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
      prompt += `Here is some extra context to be considered: ${response.value}`;
    }

    try {
      const hypedocSummaries = await callChatGPTApi(prompt, prsData);
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
        message: chalk.yellow(messages.raconteur.copyToClipboard),
        initial: true,
        active: "yes",
        inactive: "no",
      });

      if (copyToClipboardPrompt.value && summaries) {
        await copyToClipboard(summaries);
        console.log(chalk.green("✅  PR description copied to clipboard!"));
      }

      // prompt user to navigate to https://my.sqprod.co/chat and ask for a summary from Slack and other apps for sgeller

      // string variable containing a prompt for chatGPT to ask for a summary of my achievements over the past week
      const chatPrompt = `
You are a helpful assistant. Generate a clear, concise and structured summary of my achievements over the past week, sourcing from Slack and other apps. 
Focus only on what appear to be significant or important work achievements.
      
Use bullet-points and numbered lists where necessary and appropriate, especially when detailing changes.
      
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
      console.log(
        "Here is a prompt to paste into Square's chatGPT:\n",
        chalk.green(chatPrompt),
      );
      const openChatPrompt = await prompts({
        type: "toggle",
        name: "value",
        message: chalk.yellow(
          "📋 Open https://my.sqprod.co/chat to ask for a summary?",
        ),
        initial: true,
        active: "yes",
        inactive: "no",
      });

      if (openChatPrompt.value) {
        // open  https://my.sqprod.co/chat in a browser
        exec("open https://my.sqprod.co/chat");
      }
    } catch (error) {
      console.error(chalk.red(`Failed to process PRs: ${error}`));
    }
  }
}

const summarizer = new PRSummarizer();
summarizer.run();
