import chalk from "chalk";

export const raconteurMessages = {
  startingSummary: chalk.blue("🤖 Starting PR summary generation..."),
  summaryComplete: chalk.green("✅ PR summary generated successfully!"),
  summaryError: chalk.red("❌ Error generating PR summary:"),
  copyToClipboard: "📋 Copy to clipboard",
  openChatPrompt: "📋 Open Square ChatGPT?",
  copyChatPromptToClipboard: "📋 Copy Square ChatGPT prompt to clipboard?",
};
