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

type JiraApiOptions = {
  protocol: string;
  host: string;
  strictSSL: boolean;
}
const DEFAULT_OPTIONS: JiraApiOptions = {
  protocol: "https",
  host: "block.atlassian.net",
  strictSSL: true,
}

export default class Jira {
  private jiraApi: JiraApi
  

  constructor(username: string, apiKey: string, options: Partial<JiraApiOptions> = {}) {
    this.jiraApi = new JiraApi({
      ...DEFAULT_OPTIONS,
      ...options,
      username,
      password: apiKey,
      apiVersion: "2",
    });
  }

  async getIssue(ticketNumber: string): Promise<JiraIssue | undefined> {
    const issue = await this.jiraApi.findIssue(ticketNumber);

    return issue ? toJiraIssue(issue) : undefined;
  }
}