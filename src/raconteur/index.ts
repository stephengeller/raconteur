import moment from "moment";
import dotenv from "dotenv";
import { exec } from "child_process";
import { setupExitHandlers } from "../utils/exitHandler";
import { PullRequest } from "./types";
import { GitHubService } from "./services/github";
import { SummaryGenerator } from "./services/summaryGenerator";
import { UserPrompts } from "./ui/prompts";
import { ClipboardManager } from "./utils/clipboard";
import { ConfigManager } from "./config";
import { Logger } from "./services/logger";
import { messages } from "../messages";
import { RaconteurError } from "./errors";

dotenv.config();
setupExitHandlers();

export class Raconteur {
  private readonly config: ReturnType<typeof ConfigManager.prototype.getConfig>;
  private readonly githubService: GitHubService;
  private readonly summaryGenerator: SummaryGenerator;
  private readonly clipboardManager: ClipboardManager;

  constructor() {
    this.config = ConfigManager.getInstance().getConfig();
    this.githubService = new GitHubService(this.config.github);
    this.summaryGenerator = new SummaryGenerator();
    this.clipboardManager = new ClipboardManager();
  }

  public async run(): Promise<void> {
    try {
      await this.initialize();
      await this.processPRs();
      await this.handleSocialSummary();
    } catch (error: unknown) {
      if (error instanceof RaconteurError) {
        Logger.error(error.message);
      } else if (error instanceof Error) {
        Logger.error("An unexpected error occurred", error);
      } else {
        Logger.error("An unknown error occurred");
      }
      process.exit(1);
    }
  }

  private async initialize(): Promise<void> {
    if (this.config.hypedoc?.url) {
      Logger.info(`Hypedoc URL: ${this.config.hypedoc.url}`);
    }
  }

  private async processPRs(): Promise<void> {
    const weeksAgo = await UserPrompts.getWeeksAgo();
    const sinceDate = moment().subtract(weeksAgo, "weeks").format();
    const prs = await this.githubService.fetchMergedPRs(sinceDate);

    if (prs.length > 0) {
      await this.handlePRSummary(prs);
    } else {
      Logger.warning(
        "No PRs found for the specified duration. Have you authorized squareup for your personal access token?",
      );
    }
  }

  private async handlePRSummary(prs: PullRequest[]): Promise<void> {
    const selectedPRs = await UserPrompts.selectPRs(prs);
    if (selectedPRs.length === 0) {
      Logger.warning("No PRs selected for summarization.");
      return;
    }

    const summary =
      await this.summaryGenerator.generateGitHubSummary(selectedPRs);
    Logger.success("PR summaries generated:\n");
    console.log(summary.content);

    await this.clipboardManager.copyWithConfirmation(summary.content);
  }

  private async handleSocialSummary(): Promise<void> {
    if (await UserPrompts.confirmSocialSummary(this.config.goose.enabled)) {
      try {
        const summary = await this.summaryGenerator.generateSocialSummary(
          this.config.goose.enabled,
        );

        if (this.config.goose.enabled) {
          Logger.success("Social achievements summary generated:\n");
          console.log(summary.content);
          await this.clipboardManager.copyWithConfirmation(summary.content);
        } else {
          await this.clipboardManager.copyWithConfirmation(
            summary.content,
            messages.raconteur.copyChatPromptToClipboard,
          );
          exec("open https://my.sqprod.co/chat");
          Logger.success("Opening Square ChatGPT in browser...");
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new RaconteurError(
            `Failed to generate social summary: ${error.message}`,
            "SOCIAL_SUMMARY_ERROR",
          );
        } else {
          throw new RaconteurError(
            "Failed to generate social summary: Unknown error",
            "SOCIAL_SUMMARY_ERROR",
          );
        }
      }
    }
  }
}
