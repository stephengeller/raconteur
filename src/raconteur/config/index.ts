import path from 'path';
import { ConfigurationError } from '../errors';

export interface RaconteurConfig {
  github: {
    token: string;
    username: string;
  };
  goose: {
    enabled: boolean;
    promptPath: string;
  };
  hypedoc?: {
    url?: string;
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: RaconteurConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): RaconteurConfig {
    const token = process.env.GITHUB_TOKEN;
    const username = process.env.GITHUB_USERNAME;

    if (!token || !username) {
      throw new ConfigurationError('Missing required GitHub configuration');
    }

    return {
      github: { token, username },
      goose: {
        enabled: process.env.GOOSE_SUMMARY === 'true',
        promptPath: path.resolve(__dirname, '../prompts/social-achievements.md'),
      },
      hypedoc: {
        url: process.env.HYPEDOC_URL,
      },
    };
  }

  getConfig(): RaconteurConfig {
    return this.config;
  }
}