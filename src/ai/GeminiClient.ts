import { AiUnavailableError, type AiClient } from "./AiClient";

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 30_000;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export class GeminiClient implements AiClient {
  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string,
  ) {}

  async generateJson(prompt: string): Promise<unknown> {
    if (!this.apiKey) throw new AiUnavailableError("nenustatytas GEMINI_API_KEY");

    try {
      return JSON.parse(await this.requestText(prompt, this.apiKey));
    } catch (error) {
      if (error instanceof AiUnavailableError) throw error;
      throw new AiUnavailableError(error instanceof Error ? error.message : "Gemini užklausa nepavyko");
    }
  }

  private async requestText(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/${this.model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new AiUnavailableError(`Gemini grąžino klaidą ${response.status}`);

    const body = (await response.json()) as GeminiResponse;
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
    if (!text) throw new AiUnavailableError("Gemini grąžino tuščią atsakymą");
    return text;
  }
}
