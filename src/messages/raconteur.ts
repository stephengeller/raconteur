import chalk from "chalk";

export const raconteurMessages = {
  startingSummary: chalk.blue("🤖 Starting PR summary generation..."),
  summaryComplete: chalk.green("✅ PR summary generated successfully!"),
  summaryError: chalk.red("❌ Error generating PR summary:"),
  copyToClipboard: "📋 Copy to clipboard",
  openChatPrompt: "📋 Open Square ChatGPT?",
  copyChatPromptToClipboard: "📋 Copy Square ChatGPT prompt to clipboard?",
  chatPromptTemplate: `
You are helping to document non-coding achievements and social contributions at Block for a performance review. Focus on activities, interactions, and achievements found in Slack, meeting notes, documentation, and other non-GitHub sources. Generate a clear, impactful summary that maps to three key performance areas: Betterment, Behavior, and Impact.

Required Markdown Format:
###### Month D, YYYY
- **[Category]** Achievement description

Performance Categories:

1. Betterment (Focus on organizational improvement):
   - Running or improving team rituals
   - Creating or updating non-code documentation
   - Introducing new tools or processes
   - Sharing knowledge through presentations/demos
   - Improving team culture initiatives
   - Taking on unowned responsibilities

2. Behavior (Focus on leadership and collaboration):
   - Leading meetings or discussions
   - Cross-team coordination
   - Mentoring and supporting team members
   - Contributing to psychological safety
   - Facilitating team decisions
   - Organizing team events or activities

3. Impact (Focus on measurable outcomes):
   - Team efficiency improvements
   - Successful project coordination
   - Process streamlining results
   - Team satisfaction improvements
   - Knowledge sharing outcomes
   - Organizational improvements

Example Output:
## December 4, 2024
- **[Impact]** Led the Trust All-Hands demo for Tap To Confirm feature, effectively communicating the project's value to 200+ attendees
- **[Behavior]** Coordinated multiple cross-functional meetings between Design, Engineering, and Product teams to ensure alignment on PIN verification requirements
- **[Betterment]** Organized and facilitated a team workshop on AI tools, improving team efficiency and encouraging innovation

## November 28, 2024
- **[Behavior]** Successfully mediated design and engineering discussions around UI implementation, maintaining positive team dynamics while reaching technical consensus
- **[Betterment]** Introduced new team ritual for sharing knowledge about AI developments, increasing team engagement in emerging technologies

Look for achievements in:
1. Team Interactions:
   - Meeting participation and leadership
   - Cross-team collaboration
   - Conflict resolution
   - Team building activities

2. Knowledge Sharing:
   - Presentations given
   - Documentation created
   - Training sessions conducted
   - Best practices shared

3. Process Improvements:
   - Team ritual enhancements
   - Workflow optimizations
   - Communication improvements
   - Tool adoption advocacy

4. Leadership Activities:
   - Meeting facilitation
   - Decision-making guidance
   - Stakeholder management
   - Team support and mentoring

Key Phrases by Category:
Betterment:
- "Introduced new process for..."
- "Created documentation about..."
- "Improved team ritual by..."
- "Established new practice of..."

Behavior:
- "Led discussion on..."
- "Facilitated collaboration between..."
- "Mentored team members in..."
- "Coordinated with stakeholders to..."

Impact:
- "Improved team efficiency by..."
- "Reduced meeting time through..."
- "Increased team participation in..."
- "Successfully delivered presentation to..."

Remember:
- Focus on non-coding achievements
- Emphasize social and organizational impact
- Include specific numbers where possible (e.g., "presented to 50+ people")
- Highlight cross-team collaboration
- Note improvements to team processes
- Document leadership moments
- Include cultural contributions
- Emphasize knowledge sharing activities

Avoid:
- Technical implementation details
- Code-specific achievements
- GitHub pull requests or commits
- Development metrics

Format Rules:
1. Use level 6 headings (######) for dates
2. Bold category tags with ** syntax
3. Group by date in reverse chronological order
4. Include blank lines between sections
5. Use consistent list item indentation
6. Keep entries concise but impactful`,
};
