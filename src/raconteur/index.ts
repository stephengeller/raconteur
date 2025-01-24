import { Octokit } from "@octokit/rest";
import moment from "moment";
import * as fs from "fs";
import dotenv from "dotenv";
import chalk from "chalk";
import prompts from "prompts";
import { callChatGPTApi } from "../ChatGPTApi";
import { copyToClipboard } from "../copyToClipboard";
import { exec } from "child_process";
import { messages } from "../messages";
import { loadCustomPrompt } from "../prDescriptionGenerator/prompts/customPrompt";
import path from "path";
import { setupExitHandlers } from "../utils/exitHandler";
import { PullRequest } from "./types";
import {
  GITHUB_ACHIEVEMENTS_PROMPT,
  SOCIAL_ACHIEVEMENTS_PROMPT,
} from "./prompts";

dotenv.config();

setupExitHandlers();

export class Raconteur {
  private octokit: Octokit;
  private username: string | undefined;
  private sinceDate: string;

  constructor() {
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.username = process.env.GITHUB_USERNAME;
    // Initialize sinceDate with a temporary value, will be updated based on user input
    this.sinceDate = moment().format();
  }

  public async run(): Promise<void> {
    // If HYPEDOC_URL is set, open it immediately
    if (process.env.HYPEDOC_URL) {
      exec(`open "${process.env.HYPEDOC_URL}"`);
      console.log(chalk.green("🌐 Opening hypedoc in browser..."));
    }

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

      // Handle chat prompt for additional summary
      console.log(
        chalk.blue(
          "\nWould you like to generate an additional summary from Slack and other apps?",
        ),
      );

      const openChatPrompt = await prompts({
        type: "toggle",
        name: "value",
        message: chalk.yellow(messages.raconteur.openChatPrompt),
        initial: true,
        active: "yes",
        inactive: "no",
      });

      if (openChatPrompt.value) {
        // Prompt to copy the template to clipboard
        const copyPrompt = await prompts({
          type: "toggle",
          name: "value",
          message: chalk.yellow(messages.raconteur.copyChatPromptToClipboard),
          initial: true,
          active: "yes",
          inactive: "no",
        });

        if (copyPrompt.value) {
          await copyToClipboard(SOCIAL_ACHIEVEMENTS_PROMPT);
          console.log(
            chalk.green("✅  Chat prompt template copied to clipboard!"),
          );
        }

        // Open chat in browser
        exec("open https://my.sqprod.co/chat");
        console.log(chalk.green("🌐  Opening Square ChatGPT in browser..."));
      }
    } catch (error) {
      console.error(chalk.red(`Failed to process PRs: ${error}`));
    }
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
        const dateStr = chalk.gray(moment(pr.closed_at).format("DD MMM"));
        const repoInfo = `${chalk.cyan(repo)} ${chalk.yellow('#' + pr.number)}`;
        const title = chalk.white(pr.title);
        
        return {
          title: `⬡ ${dateStr} | ${repoInfo} | ${title}`,
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

    const customPromptPath = path.resolve(`./customRaconteurPrompt.txt`);
    const customPrompt = loadCustomPrompt(customPromptPath);
    const prompt = customPrompt || GITHUB_ACHIEVEMENTS_PROMPT;

    if (customPrompt) {
      console.log(chalk.blue(`Using custom prompt from: ${customPromptPath}`));
    } else {
      console.log(chalk.blue(`Using default prompt`));
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
}