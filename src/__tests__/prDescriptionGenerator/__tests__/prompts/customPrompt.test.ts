import * as fs from "fs";
import {
  CUSTOM_PROMPT_PATH,
  loadCustomPrompt,
} from "../../../../prDescriptionGenerator/prompts/customPrompt";

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.spyOn(console, "warn").mockImplementation(() => {});

describe("loadCustomPrompt", () => {
  it("returns the custom prompt content when the file exists", () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue("custom prompt content");

    const result = loadCustomPrompt();

    expect(result).toBe("custom prompt content");
  });

  it("accepts a custom path", () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue("custom prompt content");

    const result = loadCustomPrompt("foo");

    expect(result).toBe("custom prompt content");
    expect(fs.existsSync).toHaveBeenCalledWith("foo");
  });

  it("returns null when the custom prompt file does not exist", () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = loadCustomPrompt();

    expect(result).toBeNull();
  });

  it("returns null and logs a warning when an error occurs", () => {
    (fs.existsSync as jest.Mock).mockImplementation(() => {
      throw new Error("Failed to check if file exists");
    });

    const result = loadCustomPrompt();

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Warning: Failed to load custom prompt from ${CUSTOM_PROMPT_PATH}`,
      ),
    );
  });
});
