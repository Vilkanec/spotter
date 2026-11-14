const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 30_000;

export class AiUnavailableError extends Error {}

export class GeminiClient {
  #apiKey;
  #model;

  constructor(apiKey, model) {
    this.#apiKey = apiKey;
    this.#model = model;
  }

  async generateJson(prompt) {
    if (!this.#apiKey) throw new AiUnavailableError("nenustatytas GEMINI_API_KEY");

    try {
      return JSON.parse(await this.#requestText(prompt));
    } catch (error) {
      if (error instanceof AiUnavailableError) throw error;
      throw new AiUnavailableError(error instanceof Error ? error.message : "Gemini užklausa nepavyko");
    }
  }

  async #requestText(prompt) {
    const response = await fetch(`${API_BASE_URL}/${this.#model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": this.#apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new AiUnavailableError(`Gemini grąžino klaidą ${response.status}`);

    const body = await response.json();
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
    if (!text) throw new AiUnavailableError("Gemini grąžino tuščią atsakymą");
    return text;
  }
}
