import fs from 'fs';
import prompts from 'prompts';
import { maybeRewritePrompt, extraContextPrompt, getJiraTicketDescription } from '../../utils';
import JiraApi from '../../apis/JiraApi';

jest.mock('fs');
jest.mock('prompts');
jest.mock('../../apis/JiraApi');

describe('utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SQUAREUP_EMAIL;
    delete process.env.JIRA_API_TOKEN;
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

    it('should handle file system errors when saving prompt', async () => {
      const newPrompt = 'new custom prompt';
      const mockError = new Error('File system error');
      (prompts as unknown as jest.Mock)
        .mockResolvedValueOnce({ value: true })
        .mockResolvedValueOnce({ value: newPrompt });
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      const result = await maybeRewritePrompt(mockInputPrompt);

      expect(result).toBe(newPrompt);
      // Error should be logged but not thrown
      expect(fs.writeFileSync).toHaveBeenCalled();
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

    it('should handle undefined input', async () => {
      (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: undefined });

      const result = await extraContextPrompt();

      expect(result).toBe('');
    });
  });

  describe('getJiraTicketDescription', () => {
    beforeEach(() => {
      process.env.SQUAREUP_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'token123';
    });

    it('should automatically fetch and return ticket description', async () => {
      const mockIssue = {
        key: 'TEST-123',
        summary: 'Test Summary',
        description: 'Test Description'
      };

      // Mock the JiraApi class
      const mockJiraApi = {
        getUserIssues: jest.fn().mockResolvedValue([mockIssue]),
        getIssue: jest.fn().mockResolvedValue(mockIssue)
      };

      (JiraApi as jest.Mock).mockImplementation(() => mockJiraApi);

      // Mock user selecting issue from autocomplete
      (prompts as unknown as jest.Mock)
        .mockResolvedValueOnce({ selectedIssue: mockIssue });

      const result = await getJiraTicketDescription();

      expect(mockJiraApi.getUserIssues).toHaveBeenCalledWith();
      expect(result).toContain(mockIssue.key);
      expect(result).toContain(mockIssue.summary);
      expect(result).toContain(mockIssue.description);
    });

    it('should handle manual ticket entry when "enter" is selected', async () => {
      const mockIssue = {
        key: 'TEST-123',
        summary: 'Test Summary',
        description: 'Test Description'
      };

      // Mock the JiraApi class
      const mockJiraApi = {
        getUserIssues: jest.fn().mockResolvedValue([mockIssue]),
        getIssue: jest.fn().mockResolvedValue(mockIssue)
      };

      (JiraApi as jest.Mock).mockImplementation(() => mockJiraApi);

      // Mock user selecting "enter" and providing ticket number
      (prompts as unknown as jest.Mock)
        .mockResolvedValueOnce({ selectedIssue: 'enter' })
        .mockResolvedValueOnce({ ticket: 'TEST-123' });

      const result = await getJiraTicketDescription();

      expect(mockJiraApi.getUserIssues).toHaveBeenCalledWith();
      expect(mockJiraApi.getIssue).toHaveBeenCalledWith('TEST-123');
      expect(result).toContain(mockIssue.key);
      expect(result).toContain(mockIssue.summary);
      expect(result).toContain(mockIssue.description);
    });

    it('should handle when no ticket is selected', async () => {
      const mockIssue = {
        key: 'TEST-123',
        summary: 'Test Summary',
        description: 'Test Description'
      };

      // Mock the JiraApi class
      const mockJiraApi = {
        getUserIssues: jest.fn().mockResolvedValue([mockIssue])
      };

      (JiraApi as jest.Mock).mockImplementation(() => mockJiraApi);

      // Mock user selecting "none"
      (prompts as unknown as jest.Mock)
        .mockResolvedValueOnce({ selectedIssue: 'none' });

      const result = await getJiraTicketDescription();

      expect(mockJiraApi.getUserIssues).toHaveBeenCalledWith();
      expect(result).toBe('');
    });

    it('should handle missing environment variables', async () => {
      delete process.env.SQUAREUP_EMAIL;
      delete process.env.JIRA_API_TOKEN;

      const result = await getJiraTicketDescription();

      expect(result).toBe('');
    });

    it('should handle Jira API errors', async () => {
      // Mock the JiraApi class to throw an error
      const mockJiraApi = {
        getUserIssues: jest.fn().mockRejectedValue(new Error('API Error'))
      };

      (JiraApi as jest.Mock).mockImplementation(() => mockJiraApi);

      const result = await getJiraTicketDescription();

      expect(mockJiraApi.getUserIssues).toHaveBeenCalledWith();
      expect(result).toBe('');
    });
  });
});