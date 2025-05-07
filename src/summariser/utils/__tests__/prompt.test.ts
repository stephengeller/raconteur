import fs from "fs/promises";
import { processPromptTemplate } from "../prompt";

jest.mock("fs/promises");
const mockedFs = fs as jest.Mocked<typeof fs>;

describe("prompt utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("processPromptTemplate", () => {
    it("should replace REPO_ROOT in template", async () => {
      const template = "Save to {REPO_ROOT}/tmp/summaries/file.md";
      mockedFs.readFile.mockResolvedValue(template);

      const result = await processPromptTemplate("/path/to/template", {
        REPO_ROOT: "/Users/sgeller/raconteur",
        WEEKS_AGO: 2
      });

      expect(result).toBe("Save to /Users/sgeller/raconteur/tmp/summaries/file.md");
    });

    it("should replace WEEKS_AGO in template", async () => {
      const template = "Analyze the past {WEEKS_AGO} weeks of activity";
      mockedFs.readFile.mockResolvedValue(template);

      const result = await processPromptTemplate("/path/to/template", {
        REPO_ROOT: "/Users/sgeller/raconteur",
        WEEKS_AGO: 2
      });

      expect(result).toBe("Analyze the past 2 weeks of activity");
    });

    it("should handle both variables together", async () => {
      const template = "Save to {REPO_ROOT}/tmp/summaries/file.md and analyze {WEEKS_AGO} weeks";
      mockedFs.readFile.mockResolvedValue(template);

      const result = await processPromptTemplate("/path/to/template", {
        REPO_ROOT: "/Users/sgeller/raconteur",
        WEEKS_AGO: 3
      });

      expect(result).toBe("Save to /Users/sgeller/raconteur/tmp/summaries/file.md and analyze 3 weeks");
    });

    it("should leave unmatched variables unchanged", async () => {
      const template = "Hello {UNMATCHED} and {REPO_ROOT}";
      mockedFs.readFile.mockResolvedValue(template);

      const result = await processPromptTemplate("/path/to/template", {
        REPO_ROOT: "/Users/sgeller/raconteur",
        WEEKS_AGO: 2
      });

      expect(result).toBe("Hello {UNMATCHED} and /Users/sgeller/raconteur");
    });

    it("should handle multiple occurrences of variables", async () => {
      const template = "{REPO_ROOT}/one and {REPO_ROOT}/two for {WEEKS_AGO} and {WEEKS_AGO} weeks";
      mockedFs.readFile.mockResolvedValue(template);

      const result = await processPromptTemplate("/path/to/template", {
        REPO_ROOT: "/Users/sgeller/raconteur",
        WEEKS_AGO: 4
      });

      expect(result).toBe("/Users/sgeller/raconteur/one and /Users/sgeller/raconteur/two for 4 and 4 weeks");
    });

    it("should handle templates with no variables", async () => {
      const template = "No variables here";
      mockedFs.readFile.mockResolvedValue(template);

      const result = await processPromptTemplate("/path/to/template", {
        REPO_ROOT: "/Users/sgeller/raconteur",
        WEEKS_AGO: 2
      });

      expect(result).toBe("No variables here");
    });
  });
});