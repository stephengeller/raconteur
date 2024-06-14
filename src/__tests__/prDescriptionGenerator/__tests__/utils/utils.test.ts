import { getPRDescription } from "../../../../prDescriptionGenerator/utils/utils";
import { callChatGPTApi } from "../../../../ChatGPTApi";

jest.mock("../../../../ChatGPTApi", () => ({
  callChatGPTApi: jest.fn(),
}));

jest.mock("ora", () => {
  return jest.fn().mockImplementation(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn(),
  }));
});

jest.spyOn(console, "error").mockImplementation(() => {});

describe("getPRDescription", () => {
  it("generates a PR description successfully", async () => {
    (callChatGPTApi as jest.Mock).mockResolvedValue("Generated PR description");
    const result = await getPRDescription("prompt", "diffContent");
    expect(result).toBe("Generated PR description");
  });

  it("handles error when generating PR description fails", async () => {
    (callChatGPTApi as jest.Mock).mockRejectedValue(
      new Error("Failed to generate PR description"),
    );
    await expect(getPRDescription("prompt", "diffContent")).rejects.toThrow(
      "Failed to generate PR description",
    );
  });
});
