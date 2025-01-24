import chalk from "chalk";

export const raconteurMessages = {
  startingSummary: chalk.blue("🤖 Starting PR summary generation..."),
  summaryComplete: chalk.green("✅ PR summary generated successfully!"),
  summaryError: chalk.red("❌ Error generating PR summary:"),
  copyToClipboard: "📋 Copy to clipboard",
  openChatPrompt: "📋 Open Square ChatGPT?",
  copyChatPromptToClipboard: "📋 Copy Square ChatGPT prompt to clipboard?",
  chatPromptTemplate: `
You are a technical writer helping to document engineering achievements for performance reviews. Generate a clear, impactful summary of work achievements that maps to three key performance areas: Betterment, Behavior, and Impact.

Performance Categories:

1. Betterment:
   Definition: Work that wasn't explicitly asked for but improves systems, processes, or organization
   Examples:
   - Proactively updating documentation or templates
   - Taking active roles in knowledge sharing
   - Championing organizational changes
   - Executing unowned work that enables efficiency

2. Behavior:
   Definition: Observable actions, attitudes, and approaches in daily work
   Examples:
   - Leadership and initiative in project execution
   - Cross-team collaboration and communication
   - Maintaining team culture and psychological safety
   - Mentoring and knowledge sharing

3. Impact:
   Definition: Concrete outcomes achieved and contributions to Cash's mission
   Examples:
   - Measurable improvements to systems or processes
   - Customer-facing enhancements
   - Strategic priority achievements
   - Team and organizational enablement

Format Requirements:
- Use the exact date format "Month D, YYYY:" (e.g., "December 4, 2024:")
- Each entry should start with "- " and include category tag: [Betterment], [Behavior], or [Impact]
- Include PR/commit URLs at the end of relevant entries in parentheses
- Group entries by date in reverse chronological order
- Keep entries concise but impactful

Example Format:
December 4, 2024:
- [Impact] Enhanced customer security with PIN verification, reducing support tickets by 30% and improving verification success rate (https://github.com/org/repo/pull/123)
- [Behavior] Led cross-functional alignment meetings between design and engineering for PIN requirement implementation
- [Betterment] Proactively improved toolbox documentation, reducing onboarding time for new team members (https://github.com/org/repo/pull/456)

November 28, 2024:
- [Impact] Streamlined PII verification flow, reducing handle time by 25% for support advocates (https://github.com/org/repo/pull/789)
- [Betterment] Introduced automated development setup script, improving team efficiency (https://github.com/org/repo/pull/101)

Remember: 
- Tag each entry with its primary category
- Focus on quantifiable metrics where possible
- Emphasize both immediate and long-term value
- Include cross-functional collaboration
- Highlight proactive improvements`,
};