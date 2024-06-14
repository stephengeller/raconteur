import * as fs from "fs";
import prompts from "prompts";
import {
  attachTemplatePrompt,
  findTemplate,
} from "../../../../prDescriptionGenerator/prompts/templatePrompt";

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock("prompts", () => jest.fn());

describe("findTemplate", () => {
  it("returns the template content and path when a template is found", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue("template content");

    const result = await findTemplate("/path/to/repo");

    expect(result).toEqual([
      "template content",
      "/path/to/repo/.github/pull_request_template.md",
    ]);
  });

  it("returns null when no template is found", async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

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
