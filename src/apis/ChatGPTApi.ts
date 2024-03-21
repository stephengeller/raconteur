import axios from "axios";

export async function callChatGPTApi(
  systemContent: string,
  userContent: string,
): Promise<string> {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-0125-preview", // Ensure this is the correct model identifier
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
  } catch (error) {
    console.error("Error calling ChatGPT API:", error);
    throw error; // Rethrow or handle as needed
  }
}
