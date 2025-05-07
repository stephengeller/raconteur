import * as fs from 'fs';
import * as path from 'path';
import { generateGitHubSummary, generateSocialSummary, generateCombinedSummary } from '../summaries';
import { callChatGPTApi } from '../../ChatGPTApi';
import { PullRequest } from '../types';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../../ChatGPTApi');
jest.mock('child_process');

describe('summaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fs.existsSync to return false for all paths by default
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Mock fs.writeFileSync and fs.unlinkSync
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
    
    // Mock path.resolve to return the input path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // Mock callChatGPTApi to return a test summary
    (callChatGPTApi as jest.Mock).mockResolvedValue('Test summary');
  });

  describe('generateGitHubSummary', () => {
    it('should use default GitHub prompt when no custom prompt exists', async () => {
      const prs: PullRequest[] = [{ title: 'Test PR' } as PullRequest];
      
      await generateGitHubSummary(prs);
      
      expect(callChatGPTApi).toHaveBeenCalledWith(expect.stringContaining('document GitHub achievements'), expect.any(String));
    });

    it('should use custom prompt from file when it exists', async () => {
      const customPromptPath = './customRaconteurPrompt.txt';
      const customPrompt = 'Custom GitHub prompt';
      
      // Mock fs.existsSync to return true for the custom prompt path
      (fs.existsSync as jest.Mock).mockImplementation((path) => path === customPromptPath);
      
      // Mock loadCustomPrompt to return the custom prompt
      (fs.readFileSync as jest.Mock).mockImplementation((path) => {
        if (path === customPromptPath) {
          return customPrompt;
        }
        return '';
      });
      
      const prs: PullRequest[] = [{ title: 'Test PR' } as PullRequest];
      
      await generateGitHubSummary(prs);
      
      expect(callChatGPTApi).toHaveBeenCalledWith(customPrompt, expect.any(String));
    });
  });

  describe('generateCombinedSummary', () => {
    it('should combine PR data with social data when Goose is enabled', async () => {
      const prs: PullRequest[] = [{ title: 'Test PR' } as PullRequest];
      
      // Mock child_process.exec to return social data
      const { exec } = require('child_process');
      (exec as jest.Mock).mockImplementation((cmd, callback) => {
        callback(null, 'Social data', '');
      });
      
      await generateCombinedSummary(prs, true);
      
      // Verify that callChatGPTApi was called with combined data
      const lastCallArgs = (callChatGPTApi as jest.Mock).mock.calls[0][1];
      const parsedData = JSON.parse(lastCallArgs);
      
      expect(parsedData).toHaveProperty('prs');
      expect(parsedData).toHaveProperty('socialData', 'Social data');
    });

    it('should use only PR data when Goose is disabled', async () => {
      const prs: PullRequest[] = [{ title: 'Test PR' } as PullRequest];
      
      await generateCombinedSummary(prs, false);
      
      // Verify that callChatGPTApi was called with just PR data
      const lastCallArgs = (callChatGPTApi as jest.Mock).mock.calls[0][1];
      const parsedData = JSON.parse(lastCallArgs);
      
      expect(parsedData).toHaveProperty('prs');
      expect(parsedData).toHaveProperty('socialData', '');
    });
  });
});