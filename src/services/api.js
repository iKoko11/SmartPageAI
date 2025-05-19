// API service for handling OpenAI interactions
export class ApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async summarizeContent(screenshotUrl, prompt) {
    try {
      const base64Image = screenshotUrl.split(",")[1];
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "o4-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/png;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.choices[0].message.content;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }
}
