import { spawn } from 'child_process';
import prompts from 'prompts';
import { callChatGPTApi } from '../../ChatGPTApi';
import { mockConsoleImplementation, restoreConsoleImplementation, clearConsoleMocks } from '../__mocks__/console';
import {
  cleanCommitMessage,
  visibleLength,
  truncatePath,
  calculateBoxValues,
  handleCommit,
} from '../../commitMessageGenerator/main';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));
jest.mock('prompts');
jest.mock('../../ChatGPTApi');

describe('generateCommitMessage', () => {
  beforeAll(() => {
    mockConsoleImplementation();
  });

  afterAll(() => {
    restoreConsoleImplementation();
  });

  beforeEach(() => {
    clearConsoleMocks();
  });
  describe('cleanCommitMessage', () => {
    const testCases = [
      {
        name: "should handle plaintext language identifier",
        input: "```plaintext\nfeat: add new feature\n```",
        expected: "feat: add new feature",
      },
      {
        name: "should handle text language identifier",
        input: "```text\nfeat: add new feature\n```",
        expected: "feat: add new feature",
      },
      {
        name: "should be case insensitive for language identifiers",
        input: "```PLAINTEXT\nfeat: add new feature\n```",
        expected: "feat: add new feature",
      },
      {
        name: "should handle newlines after language identifier",
        input: "```plaintext\n\nfeat: add new feature\n```",
        expected: "feat: add new feature",
      },
      {
        name: "should maintain backward compatibility with simple backticks",
        input: "```feat: add new feature```",
        expected: "feat: add new feature",
      },
      {
        name: "should properly trim whitespace",
        input: "```plaintext\n  feat: add new feature  \n```",
        expected: "feat: add new feature",
      },
      {
        name: "should handle message without any backticks",
        input: "feat: add new feature",
        expected: "feat: add new feature",
      },
      {
        name: "should handle empty message with backticks",
        input: "```plaintext\n```",
        expected: "",
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        const result = cleanCommitMessage(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('truncatePath', () => {
    const testCases = [
      {
        name: "should return full path when shorter than max length",
        input: "src/file.ts",
        maxLength: 30,
        expected: "src/file.ts",
      },
      {
        name: "should truncate path with ellipsis when longer than max length",
        input: "very/long/path/to/some/deeply/nested/file.ts",
        maxLength: 20,
        expected: "...ly/nested/file.ts",
      },
      {
        name: "should handle exact length paths",
        input: "exactly/twenty/chars.ts",
        maxLength: 20,
        expected: "...y/twenty/chars.ts",
      },
      {
        name: "should handle very short max lengths",
        input: "long/path/file.ts",
        maxLength: 5,
        expected: "...ts",
      },
    ];

    testCases.forEach(({ name, input, maxLength, expected }) => {
      it(name, () => {
        const result = truncatePath(input, maxLength);
        expect(result).toBe(expected);
      });
    });
  });

  describe('calculateBoxValues', () => {
    const testCases = [
      {
        name: "should handle empty files array",
        input: [],
        expected: {
          header: "Staged files to be committed:",
          contentWidth: 48, // 50 - 2 for borders
        },
      },
      {
        name: "should calculate width based on longest file name",
        input: [
          { file: "src/file1.ts", additions: 5, deletions: 2 },
          { file: "very/long/path/to/file2.ts", additions: 0, deletions: 3 },
        ],
        expected: {
          header: "Staged files to be committed:",
          contentWidth: 48, // Max of header length and longest truncated file + stats
        },
      },
      {
        name: "should handle files with large number of changes",
        input: [{ file: "file.ts", additions: 999, deletions: 999 }],
        expected: {
          header: "Staged files to be committed:",
          contentWidth: 48,
        },
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        const result = calculateBoxValues(input);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('visibleLength', () => {
    const testCases = [
      {
        name: "should handle plain text without ANSI codes",
        input: "Hello World",
        expected: 11,
      },
      {
        name: "should ignore ANSI color codes",
        input: "\u001b[32mHello\u001b[0m \u001b[31mWorld\u001b[0m",
        expected: 11,
      },
      {
        name: "should handle empty string",
        input: "",
        expected: 0,
      },
      {
        name: "should handle multiple ANSI codes in sequence",
        input: "\u001b[1m\u001b[32mBold Green\u001b[0m",
        expected: 10,
      },
    ];

    testCases.forEach(({ name, input, expected }) => {
      it(name, () => {
        const result = visibleLength(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('handleCommit', () => {
    const mockCommitMessage = 'test: add new feature';
    let mockSpawn: jest.Mock;

    beforeEach(() => {
      mockSpawn = spawn as unknown as jest.Mock;
      mockSpawn.mockReturnValue({
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        }),
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should commit changes when user confirms', async () => {
      (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: true });

      await handleCommit(mockCommitMessage);

      expect(mockSpawn).toHaveBeenCalledWith('git', ['commit', '-m', mockCommitMessage], {
        stdio: 'inherit',
      });
    });

    it('should not commit changes when user declines', async () => {
      (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: false });

      await handleCommit(mockCommitMessage);

      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('should handle git commit errors', async () => {
      (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: true });
      mockSpawn.mockReturnValue({
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1);
          }
        }),
      });

      await expect(handleCommit(mockCommitMessage)).rejects.toThrow();
    });

    it('should handle spawn errors', async () => {
      (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: true });
      mockSpawn.mockReturnValue({
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Spawn error'));
          }
        }),
      });

      await expect(handleCommit(mockCommitMessage)).rejects.toThrow('Spawn error');
    });
  });
});