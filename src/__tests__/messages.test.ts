import { messages } from '../messages';
import chalk from 'chalk';

describe('messages', () => {
  describe('prDescription messages', () => {
    it('should export all required prDescription message keys', () => {
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
      ] as const;

      expectedKeys.forEach(key => {
        expect(messages.prDescription).toHaveProperty(key);
        expect(typeof messages.prDescription[key]).toBe('string');
      });
    });

    it('should format prDescription messages correctly with chalk', () => {
      // Test yellow colored messages
      expect(messages.prDescription.rewritePrompt).toBe(chalk.yellow('🔄 Do you want to re-write the prompt?'));
      expect(messages.prDescription.addContext).toBe(chalk.yellow('📚 Do you want to add any context to the prompt?'));
      expect(messages.prDescription.addJiraTicket).toBe(chalk.yellow('🎫 Do you want to add a Jira ticket description?'));
      expect(messages.prDescription.selectJiraTicket).toBe(chalk.yellow('🔍 Select the Jira ticket to include in the PR description:'));

      // Test cyan colored messages
      expect(messages.prDescription.enterJiraTicket).toBe(chalk.cyan('🔢 Enter the Jira ticket number:'));
      expect(messages.prDescription.enterCustomPrompt).toBe(chalk.cyan('✏️ Enter your custom prompt:'));
      expect(messages.prDescription.enterExtraContext).toBe(chalk.cyan('📝 Enter your extra context:'));

      // Test uncolored messages
      expect(messages.prDescription.createPr).toBe('📝 Create the PR?');
      expect(messages.prDescription.copyToClipboard).toBe('📋 Copy to the clipboard?');
    });
  });

  describe('commit messages', () => {
    it('should export all required commit message keys', () => {
      const expectedKeys = [
        'generateCommit',
        'commitSuccess',
        'commitError',
        'copyToClipboard',
      ] as const;

      expectedKeys.forEach(key => {
        expect(messages.commit).toHaveProperty(key);
        expect(typeof messages.commit[key]).toBe('string');
      });
    });
  });

  describe('raconteur messages', () => {
    it('should export all required raconteur message keys', () => {
      const expectedKeys = [
        'startingSummary',
        'summaryComplete',
        'summaryError',
        'copyToClipboard',
      ] as const;

      expectedKeys.forEach(key => {
        expect(messages.raconteur).toHaveProperty(key);
        expect(typeof messages.raconteur[key]).toBe('string');
      });
    });
  });

  describe('message formatting', () => {
    it('should include emojis in all messages', () => {
      const allMessages = [
        ...Object.values(messages.prDescription),
        ...Object.values(messages.commit),
        ...Object.values(messages.raconteur),
      ];

      allMessages.forEach(message => {
        // Match any emoji, including older Unicode ranges
        expect(message).toMatch(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]/u);
      });
    });
  });
});