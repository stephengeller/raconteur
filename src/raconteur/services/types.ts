import { PullRequest } from '../types';

export interface Summary {
  content: string;
  metadata: {
    generatedAt: Date;
    source: 'github' | 'slack';
    type: 'pr' | 'social';
  };
}

export interface IGitHubService {
  fetchMergedPRs(sinceDate: string): Promise<PullRequest[]>;
}

export interface ISummaryGenerator {
  generateGitHubSummary(prs: PullRequest[]): Promise<Summary>;
  generateSocialSummary(useGoose: boolean): Promise<Summary>;
}

export interface IClipboardManager {
  copyWithConfirmation(content: string, message?: string): Promise<void>;
}