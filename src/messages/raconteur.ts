import chalk from "chalk";

export const raconteurMessages = {
  startingSummary: chalk.blue("🤖 Starting PR summary generation..."),
  summaryComplete: chalk.green("✅ PR summary generated successfully!"),
  summaryError: chalk.red("❌ Error generating PR summary:"),
  copyToClipboard: "📋 Copy to clipboard",
  openChatPrompt: "📋 Open Square ChatGPT?",
  copyChatPromptToClipboard: "📋 Copy Square ChatGPT prompt to clipboard?",
  chatPromptTemplate: `
You are a helpful assistant. Generate a clear, concise and structured summary of my achievements over the past week, sourcing from Slack and other apps. 
Focus only on what appear to be significant or important work achievements.

Please consider:
- Technical impact and improvements
- Cross-team collaboration
- Leadership and mentoring activities
- Process improvements and documentation
- Customer/user impact

Use bullet-points and numbered lists where necessary and appropriate, especially when detailing changes.

Please follow the following example as a reference for desired format:
Feb 10, 2024:
- Successfully led the development of Project X's core module, improving system efficiency by 20% and reducing latency by 15ms.
- Initiated and completed a code refactoring for the Legacy System, enhancing maintainability and reducing technical debt.
- Collaborated with Design and Product teams to implement critical user-facing features, resulting in 25% improved user engagement.
- Mentored junior developers through code reviews and pair programming sessions, improving team velocity.

Jan 25, 2024:
- Spearheaded the documentation overhaul for Project Y, reducing onboarding time by 40%.
- Led cross-team initiative to standardize deployment practices, reducing deployment issues by 60%.
- Implemented automated testing improvements, increasing test coverage by 15% and reducing CI time by 5 minutes.
`,
};
