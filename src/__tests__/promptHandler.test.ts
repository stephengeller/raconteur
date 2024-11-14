import prompts from "prompts";
import { SystemPromptHandler, MockPromptHandler } from "../promptHandler";

jest.mock("prompts");

describe("PromptHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("SystemPromptHandler", () => {
    let handler: SystemPromptHandler;

    beforeEach(() => {
      handler = new SystemPromptHandler();
    });

    describe("confirmCommit", () => {
      it("should return true when user confirms", async () => {
        (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: true });
        const result = await handler.confirmCommit("test commit message");
        expect(result).toBe(true);
        expect(prompts).toHaveBeenCalledWith({
          type: "toggle",
          name: "value",
          message: "Do you want to commit with the above message?",
          initial: true,
          active: "yes",
          inactive: "no",
        });
      });

      it("should return false when user declines", async () => {
        (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: false });
        const result = await handler.confirmCommit("test commit message");
        expect(result).toBe(false);
      });
    });

    describe("getExtraContext", () => {
      it("should return trimmed context when provided", async () => {
        const context = "  test context  ";
        (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: context });
        const result = await handler.getExtraContext();
        expect(result).toBe("test context");
        expect(prompts).toHaveBeenCalledWith({
          type: "text",
          name: "value",
          message: "Enter your extra context:",
        });
      });

      it("should return empty string when no context provided", async () => {
        (prompts as unknown as jest.Mock).mockResolvedValueOnce({ value: undefined });
        const result = await handler.getExtraContext();
        expect(result).toBe("");
      });
    });
  });

  describe("MockPromptHandler", () => {
    let handler: MockPromptHandler;

    beforeEach(() => {
      handler = new MockPromptHandler();
    });

    describe("confirmCommit", () => {
      it("should return mocked response when set", async () => {
        handler.setMockResponse("confirmCommit", true);
        const result = await handler.confirmCommit("test commit message");
        expect(result).toBe(true);
      });

      it("should throw error when no mock response set", async () => {
        await expect(handler.confirmCommit("test commit message")).rejects.toThrow(
          "No mock response set for confirmCommit"
        );
      });

      it("should throw error when wrong type of mock response set", async () => {
        handler.setMockResponse("confirmCommit", "wrong type" as any);
        await expect(handler.confirmCommit("test commit message")).rejects.toThrow(
          "No mock response set for confirmCommit"
        );
      });
    });

    describe("getExtraContext", () => {
      it("should return mocked response when set", async () => {
        handler.setMockResponse("getExtraContext", "mocked context");
        const result = await handler.getExtraContext();
        expect(result).toBe("mocked context");
      });

      it("should throw error when no mock response set", async () => {
        await expect(handler.getExtraContext()).rejects.toThrow(
          "No mock response set for getExtraContext"
        );
      });

      it("should throw error when wrong type of mock response set", async () => {
        handler.setMockResponse("getExtraContext", true as any);
        await expect(handler.getExtraContext()).rejects.toThrow(
          "No mock response set for getExtraContext"
        );
      });
    });
  });
});