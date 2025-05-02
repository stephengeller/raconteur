import prompts from "prompts";
import chalk from "chalk";
import moment from "moment";
import { messages } from "../../messages";
import { PullRequest } from "../types";

export class UserPrompts {
  static async getWeeksAgo(): Promise<number> {
    const defaultWeeks = 1;
    const response = await prompts({
      type: "number",
      name: "value",
      message: chalk.yellow("How many weeks ago should PRs be fetched from?"),
      initial: defaultWeeks,
    });
    return response.value || defaultWeeks;
  }

  static async confirmCopyToClipboard(message: string = messages.raconteur.copyToClipboard): Promise<boolean> {
    const response = await prompts({
      type: "toggle",
      name: "value",
      message: chalk.yellow(message),
      initial: true,
      active: "yes",
      inactive: "no",
    });
    return response.value;
  }

  static async confirmSocialSummary(useGoose: boolean): Promise<boolean> {
    const message = useGoose
      ? "Would you like to generate a Slack activity summary using Goose?"
      : messages.raconteur.openChatPrompt;

    const response = await prompts({
      type: "toggle",
      name: "value",
      message: chalk.yellow(message),
      initial: true,
      active: "yes",
      inactive: "no",
    });
    return response.value;
  }

  static async selectPRs(prs: PullRequest[]): Promise<PullRequest[]> {
    if (prs.length === 0) return [];

    const choices = prs
      .sort((a, b) => moment(b.closed_at).diff(moment(a.closed_at)))
      .map((pr, index) => ({
        title: UserPrompts.formatPRChoice(pr),
        value: index,
        selected: true,
      }));

    const response = await prompts({
      type: "multiselect",
      name: "selectedPRs",
      message: chalk.yellow("Select PRs to fetch summaries for:"),
      choices,
    });

    return response.selectedPRs.map((index: number) => prs[index]);
  }

  private static formatPRChoice(pr: PullRequest): string {
    const repo = pr.repository_url.split("/").pop();
    const dateStr = chalk.gray(moment(pr.closed_at).format("DD MMM"));
    const repoInfo = `${chalk.cyan(repo)} ${chalk.yellow('#' + pr.number)}`;
    return `⬡ ${dateStr} | ${repoInfo} | ${chalk.white(pr.title)}`;
  }
}