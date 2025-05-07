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
        REPO_ROOT: "/Users/sgeller/raconteur"
      });

      expect(result).toBe("Save to /Users/sgeller/raconteur/tmp/summaries/file.md");
    });

    it("should leave unmatched variables unchanged", async () => {
      const template = "Hello {UNMATCHED} and {REPO_ROOT}";
      mockedFs.readFile.mockResolvedValue(template);

      const result = await processPromptTemplate("/path/to/template", {
        REPO_ROOT: "/Users/sgeller/raconteur"
      });

      expect(result).toBe("Hello {UNMATCHED} and /Users/sgeller/raconteur");
    });

    it("should handle multiple occurrences of the same variable", async () => {
      const template = "{REPO_ROOT}/one and {REPO_ROOT}/two";
      mockedFs.readFile.mockResolvedValue(template);

      const result = await processPromptTemplate("/path/to/template", {
        REPO_ROOT: "/Users/sgeller/raconteur"
      });

      expect(result).toBe("/Users/sgeller/raconteur/one and /Users/sgeller/raconteur/two");
    });

    it("should handle templates with no variables", async () => {
      const template = "No variables here";
      mockedFs.readFile.mockResolvedValue(template);

      const result = await processPromptTemplate("/path/to/template", {
        REPO_ROOT: "/Users/sgeller/raconteur"
      });

      expect(result).toBe("No variables here");
    });
  });
});