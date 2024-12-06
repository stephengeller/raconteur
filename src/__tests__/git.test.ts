// These imports are mocked but not directly used in tests
import '../ChatGPTApi';
import { mockConsoleImplementation, restoreConsoleImplementation, clearConsoleMocks } from './__mocks__/console';
import { MockGitCommandExecutor } from '../gitCommandExecutor';
import {
  getGitDiff,
  getStagedGitDiff,
  getStagedFiles,
  parseGitNumstat,
  setGitExecutor
} from '../git';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));
jest.mock('prompts');
jest.mock('../ChatGPTApi');

describe('git utilities', () => {
  let mockExecutor: MockGitCommandExecutor;
  
  beforeAll(() => {
    mockConsoleImplementation();
  });

  afterAll(() => {
    restoreConsoleImplementation();
  });

  beforeEach(() => {
    clearConsoleMocks();
    mockExecutor = new MockGitCommandExecutor();
    setGitExecutor(mockExecutor);
  });

  describe('getGitDiff', () => {
    it('should return git diff output with default branch', async () => {
      const mockDiff = 'mock diff content';
      mockExecutor.setMockResponse('diff origin/main', mockDiff);

      const result = await getGitDiff('/test/repo');
      expect(result).toBe(mockDiff);
    });

    it('should return git diff output with custom branch', async () => {
      const mockDiff = 'mock diff content';
      mockExecutor.setMockResponse('diff custom-branch', mockDiff);

      const result = await getGitDiff('/test/repo', 'custom-branch');
      expect(result).toBe(mockDiff);
    });

    it('should throw error when no diff is found', async () => {
      mockExecutor.setMockResponse('diff origin/main', '');

      await expect(getGitDiff('/test/repo')).rejects.toThrow(
        'No git diff found. Please ensure you have changes in your branch.'
      );
    });

    it('should propagate execution errors', async () => {
      const error = new Error('Git command failed');
      mockExecutor.setMockResponse('diff origin/main', Promise.reject(error) as any);

      await expect(getGitDiff('/test/repo')).rejects.toThrow('Git command failed');
    });
  });

  describe('getStagedGitDiff', () => {
    it('should return staged git diff output in silent mode', async () => {
      const mockDiff = 'staged diff content';
      mockExecutor.setMockResponse('diff --cached', mockDiff);

      const result = await getStagedGitDiff('/test/repo', true);
      expect(result).toBe(mockDiff);
    });

    it('should handle git command errors in silent mode', async () => {
      const error = new Error('Git command failed');
      mockExecutor.setMockResponse('diff --cached', Promise.reject(error) as any);

      await expect(getStagedGitDiff('/test/repo', true))
        .rejects
        .toThrow('Failed to obtain staged git diff');
    });

    it('should handle git command errors in non-silent mode', async () => {
      const error = new Error('Git command failed');
      mockExecutor.setMockResponse('diff --cached', Promise.reject(error) as any);

      await expect(getStagedGitDiff('/test/repo', false))
        .rejects
        .toThrow('Failed to obtain staged git diff');
    });

    it('should return staged git diff output with spinner in non-silent mode', async () => {
      const mockDiff = 'staged diff content';
      mockExecutor.setMockResponse('diff --cached', mockDiff);

      const result = await getStagedGitDiff('/test/repo', false);
      expect(result).toBe(mockDiff);
    });

    it('should handle empty staged diff', async () => {
      mockExecutor.setMockResponse('diff --cached', '');

      const result = await getStagedGitDiff('/test/repo', true);
      expect(result).toBe('');
    });

    it('should handle execution errors', async () => {
      const error = new Error('Git command failed');
      mockExecutor.setMockResponse('diff --cached', Promise.reject(error) as any);

      await expect(getStagedGitDiff('/test/repo', true)).rejects.toThrow(
        'Failed to obtain staged git diff'
      );
    });
  });

  describe('parseGitNumstat', () => {
    it('should parse git numstat output correctly', () => {
      const mockNumstat = '1\t2\tfile1.ts\n3\t4\tfile2.ts';
      const result = parseGitNumstat(mockNumstat);
      
      expect(result).toEqual([
        { file: 'file1.ts', additions: 1, deletions: 2 },
        { file: 'file2.ts', additions: 3, deletions: 4 }
      ]);
    });

    it('should handle empty numstat output', () => {
      const result = parseGitNumstat('');
      expect(result).toEqual([]);
    });

    it('should handle files with spaces in names', () => {
      const mockNumstat = '1\t2\tfile with spaces.ts';
      const result = parseGitNumstat(mockNumstat);
      
      expect(result).toEqual([
        { file: 'file with spaces.ts', additions: 1, deletions: 2 }
      ]);
    });

    it('should handle multiple empty lines', () => {
      const mockNumstat = '\n1\t2\tfile1.ts\n\n3\t4\tfile2.ts\n';
      const result = parseGitNumstat(mockNumstat);
      
      expect(result).toEqual([
        { file: 'file1.ts', additions: 1, deletions: 2 },
        { file: 'file2.ts', additions: 3, deletions: 4 }
      ]);
    });
  });

  describe('getStagedFiles', () => {
    it('should parse git numstat output correctly in silent mode', async () => {
      const mockNumstat = '1\t2\tfile1.ts\n3\t4\tfile2.ts';
      mockExecutor.setMockResponse('diff --cached --numstat', mockNumstat);

      const result = await getStagedFiles('/test/repo', true);
      
      expect(result).toEqual([
        { file: 'file1.ts', additions: 1, deletions: 2 },
        { file: 'file2.ts', additions: 3, deletions: 4 }
      ]);
    });

    it('should parse git numstat output correctly in non-silent mode', async () => {
      const mockNumstat = '1\t2\tfile1.ts\n3\t4\tfile2.ts';
      mockExecutor.setMockResponse('diff --cached --numstat', mockNumstat);

      const result = await getStagedFiles('/test/repo', false);
      
      expect(result).toEqual([
        { file: 'file1.ts', additions: 1, deletions: 2 },
        { file: 'file2.ts', additions: 3, deletions: 4 }
      ]);
    });

    it('should handle empty numstat output', async () => {
      mockExecutor.setMockResponse('diff --cached --numstat', '');

      const result = await getStagedFiles('/test/repo', true);
      expect(result).toEqual([]);
    });

    it('should handle execution errors', async () => {
      const error = new Error('Git command failed');
      mockExecutor.setMockResponse('diff --cached --numstat', Promise.reject(error) as any);

      await expect(getStagedFiles('/test/repo', true)).rejects.toThrow(
        'Failed to obtain staged files'
      );
    });
  });
});