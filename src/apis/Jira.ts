import JiraApi from "jira-client";

type JiraIssue = {
  key: string;
  summary: string;
  description: string;
}

/**
 * Converts the Jira API response to a JiraIssue object.
 */
function toJiraIssue(issueResponse: any): JiraIssue {
  return {
    key: issueResponse.key,
    summary: issueResponse.fields.summary,
    description: issueResponse.fields.description,
  };
}

export default class Jira {
  private jiraApi: JiraApi

  constructor(username: string, apiKey: string) {
    this.jiraApi = new JiraApi({
      protocol: "https",
      host: "block.atlassian.net",
      username,
      password: apiKey,
      apiVersion: "2",
      strictSSL: true,
    });
  }

  async getIssue(ticketNumber: string): Promise<JiraIssue | undefined> {
    const issue = await this.jiraApi.findIssue(ticketNumber);

    return issue ? toJiraIssue(issue) : undefined;
  }
}