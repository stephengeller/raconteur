import { spawn } from "child_process";
import {
  clearConsoleMocks,
  mockConsoleImplementation,
  restoreConsoleImplementation,
} from "../__mocks__/console";
import { MockGitCommandExecutor } from "../../gitCommandExecutor";
import {
  calculateBoxValues,
  cleanCommitMessage,
  handleCommit,
  printBoxFooter,
  printBoxHeader,
  printFiles,
  truncatePath,
  visibleLength,
} from "../../commitMessageGenerator/main";

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));
jest.mock("prompts");
jest.mock("../../ChatGPTApi");

describe("git utilities", () => {
  let mockExecutor: MockGitCommandExecutor;

  beforeAll(() => {
    mockConsoleImplementation();
  });

  afterAll(() => {
    restoreConsoleImplementation();
  });

  beforeEach(() => {
    clearConsoleMocks();
  });

  describe("cleanCommitMessage", () => {
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

  describe("truncatePath", () => {
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

  describe("calculateBoxValues", () => {
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

  describe("visibleLength", () => {
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

  describe("handleCommit", () => {
    const mockCommitMessage = "test: add new feature";
    let mockSpawn: jest.Mock;
    let mockPromptHandler: { confirmCommit: jest.Mock };

    beforeEach(() => {
      mockSpawn = spawn as unknown as jest.Mock;
      mockSpawn.mockReturnValue({
        on: jest.fn((event, callback) => {
          if (event === "close") {
            callback(0);
          }
        }),
      });
      mockPromptHandler = {
        confirmCommit: jest.fn(),
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should commit changes when auto-confirm is true", async () => {
      await handleCommit(mockCommitMessage, mockPromptHandler as any, true);
      expect(mockSpawn).toHaveBeenCalledWith(
        "git",
        ["commit", "-m", mockCommitMessage],
        {
          stdio: "inherit",
        },
      );
      expect(mockPromptHandler.confirmCommit).not.toHaveBeenCalled();
    });

    it("should commit changes when user confirms", async () => {
      mockPromptHandler.confirmCommit.mockResolvedValueOnce(true);
      await handleCommit(mockCommitMessage, mockPromptHandler as any);
      expect(mockSpawn).toHaveBeenCalledWith(
        "git",
        ["commit", "-m", mockCommitMessage],
        {
          stdio: "inherit",
        },
      );
    });

    it("should not commit changes when user declines", async () => {
      mockPromptHandler.confirmCommit.mockResolvedValueOnce(false);
      await handleCommit(mockCommitMessage, mockPromptHandler as any);
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it("should handle git commit errors", async () => {
      mockPromptHandler.confirmCommit.mockResolvedValueOnce(true);
      mockSpawn.mockReturnValue({
        on: jest.fn((event, callback) => {
          if (event === "close") {
            callback(1);
          }
        }),
      });

      await expect(
        handleCommit(mockCommitMessage, mockPromptHandler as any),
      ).rejects.toThrow();
    });

    it("should handle spawn errors", async () => {
      mockPromptHandler.confirmCommit.mockResolvedValueOnce(true);
      mockSpawn.mockReturnValue({
        on: jest.fn((event, callback) => {
          if (event === "error") {
            callback(new Error("Spawn error"));
          }
        }),
      });

      await expect(
        handleCommit(mockCommitMessage, mockPromptHandler as any),
      ).rejects.toThrow("Spawn error");
    });
  });

  describe("printBoxHeader", () => {
    it("should print header with even content width", () => {
      const contentWidth = 20;
      const header = "Test Header";
      printBoxHeader(contentWidth, header);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("┌────────────────────┐"),
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Test Header"),
      );
    });

    it("should print header with odd content width", () => {
      const contentWidth = 21;
      const header = "Test Header";
      printBoxHeader(contentWidth, header);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("┌─────────────────────┐"),
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Test Header"),
      );
    });
  });

  describe("printBoxFooter", () => {
    it("should print footer with correct width", () => {
      const contentWidth = 20;
      printBoxFooter(contentWidth);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("└────────────────────┘"),
      );
    });
  });

  describe("printFiles", () => {
    it("should print files with additions and deletions", () => {
      const stagedFiles = [
        { file: "test.ts", additions: 5, deletions: 2 },
        { file: "long/path/to/file.ts", additions: 0, deletions: 3 },
      ];
      const contentWidth = 48;
      printFiles(stagedFiles, contentWidth);

      // Verify each file is printed with correct formatting
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("test.ts") &&
          expect.stringContaining("(+5)") &&
          expect.stringContaining("(-2)"),
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("...th/to/file.ts") &&
          expect.stringContaining("(-3)"),
      );
    });

    it("should handle files with no changes", () => {
      const stagedFiles = [{ file: "test.ts", additions: 0, deletions: 0 }];
      const contentWidth = 48;
      printFiles(stagedFiles, contentWidth);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("test.ts") &&
          expect.not.stringContaining("(+") &&
          expect.not.stringContaining("(-"),
      );
    });

    it("should handle empty files array", () => {
      const stagedFiles: Array<{
        file: string;
        additions: number;
        deletions: number;
      }> = [];
      const contentWidth = 48;
      printFiles(stagedFiles, contentWidth);
      expect(console.log).not.toHaveBeenCalled();
    });
  });
});
