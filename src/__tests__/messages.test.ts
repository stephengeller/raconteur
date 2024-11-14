import { messages } from '../messages';
import chalk from 'chalk';

describe('messages', () => {
  it('should export all required message keys', () => {
    const expectedKeys = [
      'createPr',
      'copyToClipboard',
      'rewritePrompt',
      'addContext',
      'addJiraTicket',
      'selectJiraTicket',
      'enterJiraTicket',
      'enterCustomPrompt',
      'enterExtraContext',
    ];

    expectedKeys.forEach(key => {
      expect(messages).toHaveProperty(key);
      expect(typeof messages[key as keyof typeof messages]).toBe('string');
    });
  });

  it('should format messages correctly with chalk', () => {
    // Test yellow colored messages
    expect(messages.rewritePrompt).toBe(chalk.yellow('🔄 Do you want to re-write the prompt?'));
    expect(messages.addContext).toBe(chalk.yellow('📚 Do you want to add any context to the prompt?'));
    expect(messages.addJiraTicket).toBe(chalk.yellow('🎫 Do you want to add a Jira ticket description?'));
    expect(messages.selectJiraTicket).toBe(chalk.yellow('🔍 Select the Jira ticket to include in the PR description:'));

    // Test cyan colored messages
    expect(messages.enterJiraTicket).toBe(chalk.cyan('🔢 Enter the Jira ticket number:'));
    expect(messages.enterCustomPrompt).toBe(chalk.cyan('✏️ Enter your custom prompt:'));
    expect(messages.enterExtraContext).toBe(chalk.cyan('📝 Enter your extra context:'));

    // Test uncolored messages
    expect(messages.createPr).toBe('📝 Create the PR?');
    expect(messages.copyToClipboard).toBe('📋 Copy to the clipboard?');
  });

  it('should include emojis in all messages', () => {
    Object.values(messages).forEach(message => {
      // Match any emoji, including older Unicode ranges
      expect(message).toMatch(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]/u);
    });
  });
});