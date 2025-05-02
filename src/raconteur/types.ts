export interface PullRequest {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  closed_at: string;
  repository_url: string;
}

export interface Config {
  github: {
    token: string;
    username: string;
  };
  goose: {
    enabled: boolean;
  };
}