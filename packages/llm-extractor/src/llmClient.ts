export interface LlmClient {
  completeJson(prompt: string): Promise<unknown>;
}

export type LlmProvider = "openai" | "openrouter";
