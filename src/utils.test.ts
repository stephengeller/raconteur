import fs from 'fs';
import prompts from 'prompts';
import { maybeRewritePrompt, extraContextPrompt, getJiraTicketDescription } from './utils';
import JiraApi from './apis/JiraApi';

jest.mock('fs');
jest.mock('prompts');
jest.mock('./apis/JiraApi');

describe('utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('maybeRewritePrompt', () => {
    const mockInputPrompt = 'original prompt';

    it('should return original prompt when user declines to rewrite', async () => {
      (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: false });

      const result = await maybeRewritePrompt(mockInputPrompt);

      expect(result).toBe(mockInputPrompt);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should return and save new prompt when user chooses to rewrite', async () => {
      const newPrompt = 'new custom prompt';
      (prompts as unknown as jest.Mock)
        .mockResolvedValueOnce({ value: true })
        .mockResolvedValueOnce({ value: newPrompt });

      const result = await maybeRewritePrompt(mockInputPrompt);

      expect(result).toBe(newPrompt);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        newPrompt,
        'utf8'
      );
    });
  });

  describe('extraContextPrompt', () => {
    it('should return empty string when no context provided', async () => {
      (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: '' });

      const result = await extraContextPrompt();

      expect(result).toBe('');
    });

    it('should return formatted context when provided', async () => {
      const context = 'Additional context';
      (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: context });

      const result = await extraContextPrompt();

      expect(result).toBe(
        '\nHere\'s some extra context on this change, please use it to contextualise this change: "Additional context"'
      );
    });

    it('should trim whitespace from context', async () => {
      const context = '  Extra context  ';
      (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: context });

      const result = await extraContextPrompt();

      expect(result).toBe(
        '\nHere\'s some extra context on this change, please use it to contextualise this change: "Extra context"'
      );
    });
  });

  describe('getJiraTicketDescription', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return empty string when Jira credentials are missing', async () => {
      delete process.env.SQUAREUP_EMAIL;
      delete process.env.JIRA_API_TOKEN;

      const result = await getJiraTicketDescription();

      expect(result).toBe('');
    });

    it('should return formatted ticket description when issue is found', async () => {
      process.env.SQUAREUP_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'token123';

      const mockIssue = {
        key: 'TEST-123',
        summary: 'Test Summary',
        description: 'Test Description'
      };

      (prompts as unknown as jest.Mock)
        .mockResolvedValueOnce({ command: 'fetch' })
        .mockResolvedValueOnce({ selectedIssue: mockIssue });

      const mockJiraApi = {
        getUserIssues: jest.fn().mockResolvedValue([mockIssue]),
        getIssue: jest.fn().mockResolvedValue(mockIssue)
      };

      (JiraApi as unknown as jest.Mock).mockImplementation(() => mockJiraApi);

      const result = await getJiraTicketDescription();

      expect(result).toContain(mockIssue.key);
      expect(result).toContain(mockIssue.summary);
      expect(result).toContain(mockIssue.description);
    });

    it('should handle manual ticket entry', async () => {
      process.env.SQUAREUP_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'token123';

      const mockIssue = {
        key: 'TEST-123',
        summary: 'Test Summary',
        description: 'Test Description'
      };

      (prompts as unknown as jest.Mock)
        .mockResolvedValueOnce({ command: 'enter' })
        .mockResolvedValueOnce({ ticket: 'TEST-123' });

      const mockJiraApi = {
        getIssue: jest.fn().mockResolvedValue(mockIssue)
      };

      (JiraApi as unknown as jest.Mock).mockImplementation(() => mockJiraApi);

      const result = await getJiraTicketDescription();

      expect(result).toContain(mockIssue.key);
      expect(result).toContain(mockIssue.summary);
      expect(result).toContain(mockIssue.description);
    });

    it('should handle when user chooses not to add ticket', async () => {
      process.env.SQUAREUP_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'token123';

      (prompts as unknown as jest.Mock).mockResolvedValueOnce({ command: 'no' });

      const result = await getJiraTicketDescription();

      expect(result).toBe('');
    });
  });
});