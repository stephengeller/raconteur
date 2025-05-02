export const DEFAULT_VALUES = {
  WEEKS_AGO: 1,
  PR_LIMIT: 100,
  DATE_FORMAT: 'DD MMM',
} as const;

export const PROMPT_MESSAGES = {
  WEEKS_AGO: 'How many weeks ago should PRs be fetched from?',
  SELECT_PRS: 'Select PRs to fetch summaries for:',
  COPY_TO_CLIPBOARD: 'Would you like to copy this to your clipboard?',
  GENERATE_SOCIAL: {
    GOOSE: 'Would you like to generate a Slack activity summary using Goose?',
    SQUARE: 'Would you like to generate an additional summary from Slack and other apps?',
  },
} as const;