import { Octokit } from "@octokit/rest";
import moment from "moment";
import { exec } from "child_process";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();

interface PullRequest {
  title: string;
  html_url: string;
  closed_at: string;
}

class PRSummarizer {
  private octokit: Octokit;
  private readonly username: string | undefined;
  private readonly sinceDate: string;

  constructor() {
    this.octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.username = process.env.GITHUB_USERNAME;

    // Set the period for which to fetch PRs, default to 2 weeks
    const periodValue: number = parseInt(
      process.env.PR_FETCH_PERIOD_VALUE || "2",
    );

    // Set the period unit for which to fetch PRs, default to weeks, but can be set to days, months, etc.
    const periodUnit: moment.unitOfTime.DurationConstructor =
      (process.env
        .PR_FETCH_PERIOD_UNIT as moment.unitOfTime.DurationConstructor) ||
      "weeks";

    this.sinceDate = moment().subtract(periodValue, periodUnit).format();
  }

  private async fetchMergedPRs(): Promise<PullRequest[]> {
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
    ) as PullRequest[];
  }

  private generateHypedocEntries(prs: PullRequest[]): void {
    console.log(`Creating hypedoc entries for [${prs.length}] pull requests:`);
    prs.forEach((pr) => {
      const mergedDate: string = moment(pr.closed_at).format("Do MMM YYYY");
      console.log(`  - ${pr.title} (merged ${mergedDate})`);
    });
  }

  private async summarizePRs(prs: PullRequest[]): Promise<void> {
    const prsData: string = JSON.stringify(prs);
    const tempFilePath: string = "./temp_prs_data.json";
    fs.writeFileSync(tempFilePath, prsData);

    const command: string = `./call-chatgpt.sh ${tempFilePath}`;
    try {
      const stdout = await this.executeCommand(command);
      console.log(stdout);
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error(`Error executing command: ${error}`);
    }
  }

  private executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`exec error: ${error}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
        }
        resolve(stdout);
      });
    });
  }

  public async run(): Promise<void> {
    console.log(`
Fetching merged PRs since ${moment(this.sinceDate).format("Do MMM YYYY")}...
`);
    try {
      const prs = await this.fetchMergedPRs();
      this.generateHypedocEntries(prs);
      console.log("\nRunning ChatGPT to summarise the PRs...\n");
      await this.summarizePRs(prs);
    } catch (error) {
      console.error(`Failed to process PRs: ${error}`);
    }
  }
}

const summarizer = new PRSummarizer();
summarizer.run();
