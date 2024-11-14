import { getGitDiff, getStagedGitDiff, getStagedFiles, parseGitNumstat, setGitExecutor } from "../git";
import { MockGitCommandExecutor } from "../gitCommandExecutor";
import { mockConsoleImplementation, restoreConsoleImplementation, clearConsoleMocks } from "./__mocks__/console";

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

  beforeEach(() => {
    mockExecutor = new MockGitCommandExecutor();
    setGitExecutor(mockExecutor);
  });

  describe("getGitDiff", () => {
    it("should return git diff output", async () => {
      const mockDiff = "mock diff content";
      mockExecutor.setMockResponse("diff origin/main", mockDiff);

      const result = await getGitDiff("/test/repo", "origin/main");
      expect(result).toBe(mockDiff);
    });

    it("should throw error when no diff is found", async () => {
      mockExecutor.setMockResponse("diff origin/main", "");

      await expect(getGitDiff("/test/repo", "origin/main")).rejects.toThrow(
        "No git diff found. Please ensure you have changes in your branch."
      );
    });

    it("should propagate execution errors", async () => {
      const error = new Error("Git command failed");
      mockExecutor.setMockResponse("diff origin/main", Promise.reject(error) as any);

      await expect(getGitDiff("/test/repo", "origin/main")).rejects.toThrow(error);
    });
  });

  describe("getStagedGitDiff", () => {
    it("should return staged git diff output in silent mode", async () => {
      const mockDiff = "staged diff content";
      mockExecutor.setMockResponse("diff --cached", mockDiff);

      const result = await getStagedGitDiff("/test/repo", true);
      expect(result).toBe(mockDiff);
    });

    it("should handle empty staged diff", async () => {
      mockExecutor.setMockResponse("diff --cached", "");

      const result = await getStagedGitDiff("/test/repo", true);
      expect(result).toBe("");
    });

    it("should handle execution errors", async () => {
      const error = new Error("Git command failed");
      mockExecutor.setMockResponse("diff --cached", Promise.reject(error) as any);

      await expect(getStagedGitDiff("/test/repo", true)).rejects.toThrow(
        "Failed to obtain staged git diff"
      );
    });
  });

  describe("parseGitNumstat", () => {
    it("should parse git numstat output correctly", () => {
      const mockNumstat = "1\t2\tfile1.ts\n3\t4\tfile2.ts";
      const result = parseGitNumstat(mockNumstat);
      
      expect(result).toEqual([
        { file: "file1.ts", additions: 1, deletions: 2 },
        { file: "file2.ts", additions: 3, deletions: 4 }
      ]);
    });

    it("should handle empty numstat output", () => {
      const result = parseGitNumstat("");
      expect(result).toEqual([]);
    });

    it("should handle files with spaces in names", () => {
      const mockNumstat = "1\t2\tfile with spaces.ts";
      const result = parseGitNumstat(mockNumstat);
      
      expect(result).toEqual([
        { file: "file with spaces.ts", additions: 1, deletions: 2 }
      ]);
    });
  });

  describe("getStagedFiles", () => {
    it("should parse git numstat output correctly", async () => {
      const mockNumstat = "1\t2\tfile1.ts\n3\t4\tfile2.ts";
      mockExecutor.setMockResponse("diff --cached --numstat", mockNumstat);

      const result = await getStagedFiles("/test/repo", true);
      
      expect(result).toEqual([
        { file: "file1.ts", additions: 1, deletions: 2 },
        { file: "file2.ts", additions: 3, deletions: 4 }
      ]);
    });

    it("should handle empty numstat output", async () => {
      mockExecutor.setMockResponse("diff --cached --numstat", "");

      const result = await getStagedFiles("/test/repo", true);
      expect(result).toEqual([]);
    });

    it("should handle files with spaces in names", async () => {
      const mockNumstat = "1\t2\tfile with spaces.ts";
      mockExecutor.setMockResponse("diff --cached --numstat", mockNumstat);

      const result = await getStagedFiles("/test/repo", true);
      
      expect(result).toEqual([
        { file: "file with spaces.ts", additions: 1, deletions: 2 }
      ]);
    });

    it("should handle execution errors", async () => {
      const error = new Error("Git command failed");
      mockExecutor.setMockResponse("diff --cached --numstat", Promise.reject(error) as any);

      await expect(getStagedFiles("/test/repo", true)).rejects.toThrow(
        "Failed to obtain staged files"
      );
    });
  });
});