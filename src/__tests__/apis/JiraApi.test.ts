import JiraClient from 'jira-client';
import JiraApi from '../../apis/JiraApi';

jest.mock('jira-client');

describe('JiraApi', () => {
  const mockUsername = 'test-user';
  const mockApiKey = 'test-api-key';
  let jiraApi: JiraApi;
  let mockJiraClient: jest.Mocked<JiraClient>;

  beforeEach(() => {
    mockJiraClient = {
      getUsersIssues: jest.fn(),
      findIssue: jest.fn(),
    } as unknown as jest.Mocked<JiraClient>;

    (JiraClient as unknown as jest.Mock).mockImplementation(() => mockJiraClient);
    jiraApi = new JiraApi(mockUsername, mockApiKey);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(JiraClient).toHaveBeenCalledWith({
        protocol: 'https',
        host: 'block.atlassian.net',
        username: mockUsername,
        password: mockApiKey,
        apiVersion: '2',
        strictSSL: true,
      });
    });

    it('should override default options with provided options', () => {
      const customOptions = {
        protocol: 'http',
        host: 'custom.atlassian.net',
        strictSSL: false,
      };

      new JiraApi(mockUsername, mockApiKey, customOptions);

      expect(JiraClient).toHaveBeenCalledWith({
        ...customOptions,
        username: mockUsername,
        password: mockApiKey,
        apiVersion: '2',
      });
    });
  });

  describe('getUserIssues', () => {
    it('should return mapped issues when open is true', async () => {
      const mockResponse = {
        issues: [
          {
            key: 'TEST-1',
            fields: {
              summary: 'Test Issue 1',
              description: 'Description 1',
            },
          },
          {
            key: 'TEST-2',
            fields: {
              summary: 'Test Issue 2',
              description: 'Description 2',
            },
          },
        ],
      };

      mockJiraClient.getUsersIssues.mockResolvedValueOnce(mockResponse);

      const result = await jiraApi.getUserIssues(true);

      expect(mockJiraClient.getUsersIssues).toHaveBeenCalledWith(mockUsername, true);
      expect(result).toEqual([
        {
          key: 'TEST-1',
          summary: 'Test Issue 1',
          description: 'Description 1',
        },
        {
          key: 'TEST-2',
          summary: 'Test Issue 2',
          description: 'Description 2',
        },
      ]);
    });

    it('should handle empty issues array', async () => {
      const mockResponse = { issues: [] };
      mockJiraClient.getUsersIssues.mockResolvedValueOnce(mockResponse);

      const result = await jiraApi.getUserIssues();

      expect(result).toEqual([]);
    });

    it('should handle undefined issues', async () => {
      const mockResponse = {};
      mockJiraClient.getUsersIssues.mockResolvedValueOnce(mockResponse);

      const result = await jiraApi.getUserIssues();

      expect(result).toEqual([]);
    });
  });

  describe('getIssue', () => {
    it('should return mapped issue when found', async () => {
      const mockIssue = {
        key: 'TEST-1',
        fields: {
          summary: 'Test Issue',
          description: 'Test Description',
        },
      };

      mockJiraClient.findIssue.mockResolvedValueOnce(mockIssue);

      const result = await jiraApi.getIssue('TEST-1');

      expect(mockJiraClient.findIssue).toHaveBeenCalledWith('TEST-1');
      expect(result).toEqual({
        key: 'TEST-1',
        summary: 'Test Issue',
        description: 'Test Description',
      });
    });

    it('should return undefined when issue not found', async () => {
      mockJiraClient.findIssue.mockResolvedValueOnce({} as any);

      const result = await jiraApi.getIssue('TEST-1');

      expect(result).toBeUndefined();
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockJiraClient.findIssue.mockRejectedValueOnce(error);

      await expect(jiraApi.getIssue('TEST-1')).rejects.toThrow('API Error');
    });
  });
});