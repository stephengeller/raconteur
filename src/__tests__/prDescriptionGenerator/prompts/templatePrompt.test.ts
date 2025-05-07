import * as fs from "fs";
import prompts from "prompts";
import {
  attachTemplatePrompt,
  findTemplate,
} from "../../../prDescriptionGenerator/prompts/templatePrompt";
import { execSync } from "child_process";

jest.spyOn(process, "exit").mockImplementation();

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

jest.mock("prompts", () => jest.fn());

describe("findTemplate", () => {
  it("returns the template content and path when a template is found", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue("template content");
    (execSync as jest.Mock).mockReturnValue("/path/to/repo");

    const result = await findTemplate("/path/to/repo");

    expect(result).toEqual([
      "template content",
      "/path/to/repo/.github/pull_request_template.md",
    ]);
  });

  it("returns null when no template is found", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (execSync as jest.Mock).mockReturnValue("/path/to/repo");

    const result = await findTemplate("/path/to/repo");

    expect(result).toBeNull();
  });

  it("returns null when not in a git repository", async () => {
    (execSync as jest.Mock).mockImplementation(() => {
      throw new Error("not a git repository");
    });

    const result = await findTemplate("/path/to/repo");

    expect(result).toBeNull();
  });
});

describe("attachTemplatePrompt", () => {
  it("returns true when the user chooses to apply the template", async () => {
    (prompts as unknown as jest.Mock).mockResolvedValue({ value: true });

    const result = await attachTemplatePrompt("/path/to/template");

    expect(result).toBe(true);
  });

  it("returns false when the user chooses not to apply the template", async () => {
    (prompts as unknown as jest.Mock).mockResolvedValue({ value: false });

    const result = await attachTemplatePrompt("/path/to/template");

    expect(result).toBe(false);
  });
});