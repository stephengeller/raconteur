import prompts from "prompts";
import chalk from "chalk";
import moment from "moment";
import { PullRequest } from "./types";

export async function promptForWeeks(): Promise<number> {
  const response = await prompts({
    type: "number",
    name: "value",
    message: chalk.yellow("How many weeks ago should PRs be fetched from?"),
    initial: 1,
  });
  return response.value || 1;
}

export async function selectPRs(prs: PullRequest[]): Promise<PullRequest[]> {
  const choices = prs
    .sort((a, b) => moment(b.closed_at).diff(moment(a.closed_at)))
    .map((pr, index) => ({
      title: formatPRChoice(pr),
      value: index,
      selected: true,
    }));

  const response = await prompts({
    type: "multiselect",
    name: "selectedPRs",
    message: chalk.yellow("Select PRs to fetch summaries for:"),
    choices,
  });

  return response.selectedPRs?.map((index: number) => prs[index]) || [];
}

export async function confirmSocialSummary(useGoose: boolean): Promise<boolean> {
  const message = useGoose
    ? "Generate Slack activity summary using Goose?"
    : "Generate additional summary from Slack and other apps?";

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

export async function copyToClipboardWithConfirmation(content: string, message = "Copy to clipboard?"): Promise<void> {
  const response = await prompts({
    type: "toggle",
    name: "value",
    message: chalk.yellow(message),
    initial: true,
    active: "yes",
    inactive: "no",
  });

  if (response.value) {
    const { copyToClipboard } = await import("../copyToClipboard");
    await copyToClipboard(content);
    console.log(chalk.green("✅ Copied to clipboard!"));
  }
}

function formatPRChoice(pr: PullRequest): string {
  const repo = pr.repository_url.split("/").pop();
  const dateStr = chalk.gray(moment(pr.closed_at).format("DD MMM"));
  const repoInfo = `${chalk.cyan(repo)} ${chalk.yellow('#' + pr.number)}`;
  return `⬡ ${dateStr} | ${repoInfo} | ${chalk.white(pr.title)}`;
}