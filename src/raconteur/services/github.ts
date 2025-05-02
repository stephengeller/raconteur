import { Octokit } from "@octokit/rest";
import moment from "moment";
import { PullRequest } from "../types";

export class GitHubService {
  private octokit: Octokit;
  private username: string;

  constructor(token: string, username: string) {
    this.octokit = new Octokit({ auth: token });
    this.username = username;
  }

  async fetchMergedPRs(sinceDate: string): Promise<PullRequest[]> {
    const searchResponse = await this.octokit.search.issuesAndPullRequests({
      q: `is:pr author:${this.username} is:merged`,
      sort: "created",
      order: "desc",
      per_page: 100,
    });

    return searchResponse.data.items.filter((pr) =>
      moment(pr.closed_at).isAfter(sinceDate),
    ) as PullRequest[];
  }
}