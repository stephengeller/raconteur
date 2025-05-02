import prompts from "prompts";
import chalk from "chalk";
import moment from "moment";
import { messages } from "../../messages";
import { PullRequest } from "../types";
import { PRChoice, UserPromptChoice } from "./types";
import { DEFAULT_VALUES, PROMPT_MESSAGES } from "../constants";
import { Logger } from "../services/logger";

export class UserPrompts {
  static async getWeeksAgo(): Promise<number> {
    const response = await prompts({
      type: "number",
      name: "value",
      message: chalk.yellow(PROMPT_MESSAGES.WEEKS_AGO),
      initial: DEFAULT_VALUES.WEEKS_AGO,
    });
    return response.value || DEFAULT_VALUES.WEEKS_AGO;
  }

  static async confirmCopyToClipboard(message: string = PROMPT_MESSAGES.COPY_TO_CLIPBOARD): Promise<boolean> {
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
      ? PROMPT_MESSAGES.GENERATE_SOCIAL.GOOSE
      : PROMPT_MESSAGES.GENERATE_SOCIAL.SQUARE;

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
      message: chalk.yellow(PROMPT_MESSAGES.SELECT_PRS),
      choices,
    });

    return response.selectedPRs.map((index: number) => prs[index]);
  }

  private static formatPRChoice(pr: PullRequest): string {
    const repo = pr.repository_url.split("/").pop();
    const dateStr = chalk.gray(moment(pr.closed_at).format(DEFAULT_VALUES.DATE_FORMAT));
    const repoInfo = `${chalk.cyan(repo)} ${chalk.yellow('#' + pr.number)}`;
    return `⬡ ${dateStr} | ${repoInfo} | ${chalk.white(pr.title)}`;
  }
}