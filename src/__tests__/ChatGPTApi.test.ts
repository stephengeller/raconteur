import axios from "axios";
import { callChatGPTApi } from "../ChatGPTApi";

jest.mock("axios");

describe("ChatGPTApi", () => {
  const mockSystemContent = "system content";
  const mockUserContent = "user content";
  const mockApiKey = "test-api-key";
  const mockModel = "test-model";

  beforeEach(() => {
    process.env.OPENAI_API_KEY = mockApiKey;
    process.env.OPENAI_MODEL = mockModel;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
  });

  it("should call OpenAI API with correct parameters", async () => {
    const mockResponse = {
      data: {
        choices: [
          {
            message: {
              content: "API response",
            },
          },
        ],
      },
    };

    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await callChatGPTApi(mockSystemContent, mockUserContent);

    expect(axios.post).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      {
        model: mockModel,
        messages: [
          {
            role: "system",
            content: mockSystemContent,
          },
          {
            role: "user",
            content: mockUserContent,
          },
        ],
      },
      {
        headers: { Authorization: `Bearer ${mockApiKey}` },
      },
    );

    expect(result).toBe("API response");
  });

  it("should handle 4xx client errors", async () => {
    const error = {
      response: {
        status: 400,
      },
      message: "Bad Request",
    };

    (axios.post as jest.Mock).mockRejectedValueOnce(error);

    await expect(
      callChatGPTApi(mockSystemContent, mockUserContent),
    ).rejects.toThrow("Client error: Bad Request");
  });

  it("should handle other errors", async () => {
    const error = new Error("Network error");
    (axios.post as jest.Mock).mockRejectedValueOnce(error);

    await expect(
      callChatGPTApi(mockSystemContent, mockUserContent),
    ).rejects.toThrow("Error calling ChatGPT API: Network error");
  });

  it("should trim response content", async () => {
    const mockResponse = {
      data: {
        choices: [
          {
            message: {
              content: "  trimmed response  ",
            },
          },
        ],
      },
    };

    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await callChatGPTApi(mockSystemContent, mockUserContent);
    expect(result).toBe("trimmed response");
  });
});
