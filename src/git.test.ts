import { exec } from "child_process";
import { getGitDiff, getStagedGitDiff, getStagedFiles } from "./git";

// Mock the exec function directly
jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

describe("git utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getGitDiff", () => {
    it("should return git diff output", async () => {
      const mockDiff = "mock diff content";
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => cb(null, { stdout: mockDiff }));

      const result = await getGitDiff("/test/repo", "origin/main");
      
      expect(exec).toHaveBeenCalledWith(
        'git -C "/test/repo" diff origin/main',
        expect.any(Function)
      );
      expect(result).toBe(mockDiff);
    });

    it("should throw error when no diff is found", async () => {
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => cb(null, { stdout: "" }));

      await expect(getGitDiff("/test/repo")).rejects.toThrow();
    });

    it("should propagate execution errors", async () => {
      const error = new Error("Git command failed");
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => cb(error));

      await expect(getGitDiff("/test/repo")).rejects.toThrow(error);
    });
  });

  describe("getStagedGitDiff", () => {
    it("should return staged git diff output in silent mode", async () => {
      const mockDiff = "staged diff content";
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => cb(null, { stdout: mockDiff }));

      const result = await getStagedGitDiff("/test/repo", true);
      
      expect(exec).toHaveBeenCalledWith(
        'git -C /test/repo diff --cached',
        expect.any(Function)
      );
      expect(result).toBe(mockDiff);
    });

    it("should handle empty staged diff", async () => {
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => cb(null, { stdout: "" }));

      const result = await getStagedGitDiff("/test/repo", true);
      
      expect(result).toBe("");
    });

    it("should handle execution errors", async () => {
      const error = new Error("Git command failed");
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => cb(error));

      await expect(getStagedGitDiff("/test/repo", true)).rejects.toThrow();
    });
  });

  describe("getStagedFiles", () => {
    it("should parse git numstat output correctly", async () => {
      const mockNumstat = "1\t2\tfile1.ts\n3\t4\tfile2.ts";
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => cb(null, { stdout: mockNumstat }));

      const result = await getStagedFiles("/test/repo", true);
      
      expect(result).toEqual([
        { file: "file1.ts", additions: 1, deletions: 2 },
        { file: "file2.ts", additions: 3, deletions: 4 }
      ]);
    });

    it("should handle empty numstat output", async () => {
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => cb(null, { stdout: "" }));

      const result = await getStagedFiles("/test/repo", true);
      
      expect(result).toEqual([]);
    });

    it("should handle files with spaces in names", async () => {
      const mockNumstat = "1\t2\tfile with spaces.ts";
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => cb(null, { stdout: mockNumstat }));

      const result = await getStagedFiles("/test/repo", true);
      
      expect(result).toEqual([
        { file: "file with spaces.ts", additions: 1, deletions: 2 }
      ]);
    });

    it("should handle execution errors", async () => {
      const error = new Error("Git command failed");
      (exec as unknown as jest.Mock).mockImplementation((cmd, cb) => cb(error));

      await expect(getStagedFiles("/test/repo", true)).rejects.toThrow();
    });
  });
});