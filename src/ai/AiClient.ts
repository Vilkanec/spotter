export interface AiClient {
  generateJson(prompt: string): Promise<unknown>;
}

export class AiUnavailableError extends Error {}
