import { Octokit } from "@octokit/rest";
import moment from "moment";
import { PullRequest } from "../types";
import { IGitHubService } from "./types";
import { GitHubError } from "../errors";
import { Logger } from "./logger";
import { DEFAULT_VALUES } from "../constants";

export class GitHubService implements IGitHubService {
  private octokit: Octokit;
  private username: string;

  constructor(config: { token: string; username: string }) {
    this.octokit = new Octokit({ auth: config.token });
    this.username = config.username;
  }

  async fetchMergedPRs(sinceDate: string): Promise<PullRequest[]> {
    try {
      Logger.progress(`Fetching merged PRs for ${this.username} since ${sinceDate}...`);
      
      const searchResponse = await this.octokit.search.issuesAndPullRequests({
        q: `is:pr author:${this.username} is:merged`,
        sort: "created",
        order: "desc",
        per_page: DEFAULT_VALUES.PR_LIMIT,
      });

      const filteredPRs = searchResponse.data.items.filter((pr) =>
        moment(pr.closed_at).isAfter(sinceDate),
      ) as PullRequest[];

      Logger.success(`Found ${filteredPRs.length} merged PRs`);
      return filteredPRs;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new GitHubError(`Failed to fetch PRs: ${error.message}`);
      }
      throw new GitHubError('Failed to fetch PRs: Unknown error');
    }
  }
}