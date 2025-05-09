import { Octokit } from "@octokit/rest";
import moment from "moment";
import dotenv from "dotenv";
import { exec } from "child_process";
import { setupExitHandlers } from "../utils/exitHandler";
import { Config, PullRequest } from "./types";
import { promptForWeeks, selectPRs, confirmSocialSummary, copyToClipboardWithConfirmation } from "./prompts";
import { generateGitHubSummary, generateSocialSummary } from "./summaries";
import { Logger } from "./logger";

dotenv.config();
setupExitHandlers();

export class Raconteur {
  private readonly config: Config;
  private readonly octokit: Octokit;

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    const username = process.env.GITHUB_USERNAME;

    if (!token || !username) {
      throw new Error('Missing required GitHub configuration');
    }

    this.config = {
      github: { token, username },
      goose: { enabled: process.env.GOOSE_SUMMARY === 'true' },
    };
    this.octokit = new Octokit({ auth: token });
  }

  async run(): Promise<void> {
    try {
      // Display hypedoc URL if available
      if (process.env.HYPEDOC_URL) {
        Logger.info(`Hypedoc URL: ${process.env.HYPEDOC_URL}`);
      }

      // Get PRs
      const weeksAgo = await promptForWeeks();
      const sinceDate = moment().subtract(weeksAgo, "weeks").format();
      const prs = await this.fetchMergedPRs(sinceDate);

      // Handle PR summary
      if (prs.length > 0) {
        Logger.info(`Found [${prs.length}] pull requests...`);
        const selectedPrs = await selectPRs(prs);
        
        if (selectedPrs.length > 0) {
          const summary = await generateGitHubSummary(selectedPrs);
          Logger.success("PR Summary:");
          console.log(summary);
          await copyToClipboardWithConfirmation(summary);
        } else {
          Logger.warning("No PRs selected for summarization.");
        }
      } else {
        Logger.warning(
          "No PRs found for the specified duration. Have you authorized squareup for your personal access token?",
        );
      }

      // Handle social summary
      if (await confirmSocialSummary(this.config.goose.enabled)) {
        const summary = await generateSocialSummary(this.config.goose.enabled);
        
        if (this.config.goose.enabled) {
          Logger.success("Social Summary:");
          console.log(summary);
          await copyToClipboardWithConfirmation(summary);
        } else {
          await copyToClipboardWithConfirmation(
            summary,
            "Copy social achievements template to clipboard?"
          );
          exec("open https://my.sqprod.co/chat");
          Logger.success("Opening Square ChatGPT in browser...");
        }
      }
    } catch (error) {
      Logger.error(error instanceof Error ? error.message : 'Unknown error', error instanceof Error ? error : undefined);
      process.exit(1);
    }
  }

  private async fetchMergedPRs(sinceDate: string): Promise<PullRequest[]> {
    const response = await this.octokit.search.issuesAndPullRequests({
      q: `is:pr author:${this.config.github.username} is:merged`,
      sort: "created",
      order: "desc",
      per_page: 100,
    });

    return response.data.items
      .filter(pr => moment(pr.closed_at).isAfter(sinceDate)) as PullRequest[];
  }
}