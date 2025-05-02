export interface PullRequest {
  number: number;
  title: string;
  body?: string;
  html_url: string;
  created_at: string;
  closed_at: string;
  repository_url: string;
}

export interface Summary {
  content: string;
  metadata: {
    generatedAt: Date;
    source: 'github' | 'slack';
    type: 'pr' | 'social';
  };
}

export interface PRChoice {
  title: string;
  value: number;
  selected: boolean;
}

export interface UserPromptChoice<T> {
  title: string;
  value: T;
  selected?: boolean;
}