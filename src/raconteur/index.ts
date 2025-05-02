import moment from "moment";
import dotenv from "dotenv";
import chalk from "chalk";
import { exec } from "child_process";
import { messages } from "../messages";
import { setupExitHandlers } from "../utils/exitHandler";
import { PullRequest } from "./types";
import { GitHubService } from "./services/github";
import { SummaryGenerator } from "./services/summaryGenerator";
import { UserPrompts } from "./ui/prompts";
import { ClipboardManager } from "./utils/clipboard";

dotenv.config();
setupExitHandlers();

export class Raconteur {
  private githubService: GitHubService;
  private useGoose: boolean;

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    const username = process.env.GITHUB_USERNAME;
    
    if (!token || !username) {
      throw new Error("GitHub token or username not set in environment variables.");
    }

    this.githubService = new GitHubService(token, username);
    this.useGoose = process.env.GOOSE_SUMMARY === 'true';
  }

  public async run(): Promise<void> {
    try {
      // Display hypedoc URL if available
      if (process.env.HYPEDOC_URL) {
        console.log(chalk.green(`🌐 Hypedoc URL: ${chalk.blue.underline(process.env.HYPEDOC_URL)}`));
      }

      // Get PRs and generate GitHub summary
      const weeksAgo = await UserPrompts.getWeeksAgo();
      const sinceDate = moment().subtract(weeksAgo, "weeks").format();
      const prs = await this.githubService.fetchMergedPRs(sinceDate);

      if (prs.length > 0) {
        await this.handlePRSummary(prs);
      } else {
        console.log(
          chalk.yellow(
            "No PRs found for the specified duration. Have you authorized squareup for your personal access token?",
          ),
        );
      }

      // Handle social summary
      await this.handleSocialSummary();

    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
    }
  }

  private async handlePRSummary(prs: PullRequest[]): Promise<void> {
    console.log(chalk.blue(`Found [${prs.length}] pull requests...`));
    
    const selectedPRs = await UserPrompts.selectPRs(prs);
    if (selectedPRs.length === 0) {
      console.log(chalk.yellow("No PRs selected for summarization."));
      return;
    }

    const summary = await SummaryGenerator.generateGitHubSummary(selectedPRs);
    console.log(chalk.green("🚀 PR summaries generated:\n\n"));
    console.log(summary);

    await ClipboardManager.copyWithConfirmation(summary);
  }

  private async handleSocialSummary(): Promise<void> {
    const summaryType = this.useGoose ? "Slack activity" : "additional summary from Slack and other apps";
    console.log(chalk.blue(`\nWould you like to analyze your ${summaryType}?`));

    if (await UserPrompts.confirmSocialSummary(this.useGoose)) {
      try {
        const summary = await SummaryGenerator.generateSocialSummary(this.useGoose);
        
        if (this.useGoose) {
          console.log(chalk.green("🚀 Social achievements summary generated:\n\n"));
          console.log(summary);
          await ClipboardManager.copyWithConfirmation(summary);
        } else {
          await ClipboardManager.copyWithConfirmation(summary, messages.raconteur.copyChatPromptToClipboard);
          exec("open https://my.sqprod.co/chat");
          console.log(chalk.green("🌐  Opening Square ChatGPT in browser..."));
        }
      } catch (error) {
        console.error(chalk.red(`Failed to generate social summary: ${error}`));
      }
    }
  }
}