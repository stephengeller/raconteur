import fs from 'fs';
import prompts from 'prompts';
import { getJiraTicketDescription } from '../../utils';
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