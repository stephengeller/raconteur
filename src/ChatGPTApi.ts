import axios, { AxiosError } from "axios";

export async function callChatGPTApi(
  systemContent: string,
  userContent: string,
): Promise<string> {
  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-4o";
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages: [
          {
            role: "system",
            content: systemContent,
          },
          {
            role: "user",
            content: userContent,
          },
        ],
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } },
    );

    // Assuming the API response structure matches the expected format.
    // You might need to adjust this based on the actual response format.
    return response.data.choices[0].message.content.trim();
  } catch (e: any) {
    const error = e as AxiosError;
    if (error?.response?.status.toString().startsWith("4")) {
      throw new Error(`Client error: ${error.message}`);
    } else {
      throw new Error(`Error calling ChatGPT API: ${error.message}`);
    }
  }
}
