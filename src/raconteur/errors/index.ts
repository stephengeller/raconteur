export class RaconteurError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'RaconteurError';
  }
}

export class GitHubError extends RaconteurError {
  constructor(message: string) {
    super(message, 'GITHUB_ERROR');
    this.name = 'GitHubError';
  }
}

export class SummaryGenerationError extends RaconteurError {
  constructor(message: string) {
    super(message, 'SUMMARY_ERROR');
    this.name = 'SummaryGenerationError';
  }
}

export class ConfigurationError extends RaconteurError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigurationError';
  }
}