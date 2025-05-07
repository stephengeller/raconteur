import fs from "fs/promises";
import { Stats } from "fs";
import path from "path";
import {
  saveSummary,
  readSummary,
  listSummaries,
  cleanupSummaries,
} from "../files";

jest.mock("fs/promises");
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("file utilities", () => {
  const mockCwd = process.cwd();
  const summariesDir = path.resolve(mockCwd, ".goose/summaries");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveSummary", () => {
    it("should save content to a timestamped file", async () => {
      const content = "Test summary content";
      const savedPath = await saveSummary(content);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/summary-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.md$/),
        content,
        "utf-8"
      );
      expect(savedPath).toMatch(/summary-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.md$/);
    });
  });

  describe("readSummary", () => {
    it("should read content from a file", async () => {
      const expectedContent = "Test summary content";
      mockedFs.readFile.mockResolvedValue(expectedContent);

      const content = await readSummary("test-file.md");
      expect(content).toBe(expectedContent);
      expect(mockedFs.readFile).toHaveBeenCalledWith("test-file.md", "utf-8");
    });
  });

  describe("listSummaries", () => {
    it("should list all summary files", async () => {
      const mockFiles = ["summary-1.md", "summary-2.md"];
      // Mock readdir to return file names
      mockedFs.readdir.mockResolvedValue(mockFiles as any);

      const files = await listSummaries();
      expect(files).toEqual(mockFiles.map(file => path.join(summariesDir, file)));
      expect(mockedFs.readdir).toHaveBeenCalledWith(summariesDir);
    });
  });

  describe("cleanupSummaries", () => {
    it("should remove old summary files keeping recent ones", async () => {
      const mockFiles = [
        "summary-1.md",
        "summary-2.md",
        "summary-3.md",
        "summary-4.md",
      ];

      // Mock readdir
      mockedFs.readdir.mockResolvedValue(mockFiles as any);

      // Mock stat with decreasing dates
      const now = new Date();
      mockFiles.forEach((_, index) => {
        mockedFs.stat.mockResolvedValueOnce({
          ctime: new Date(now.getTime() - index * 1000),
        } as Stats);
      });

      await cleanupSummaries(2);

      // Should keep the 2 newest files and delete the rest
      expect(mockedFs.unlink).toHaveBeenCalledTimes(2);
      expect(mockedFs.unlink).toHaveBeenCalledWith(
        path.join(summariesDir, "summary-3.md")
      );
      expect(mockedFs.unlink).toHaveBeenCalledWith(
        path.join(summariesDir, "summary-4.md")
      );
    });
  });
});