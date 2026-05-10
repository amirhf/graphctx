import type { LlmClient } from "./llmClient.js";
import { parseJsonObject } from "./repairJson.js";

export class OpenRouterClient implements LlmClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly temperature: number;

  constructor(options: { apiKey: string; model: string; temperature?: number }) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.temperature = options.temperature ?? 0.2;
  }

  async completeJson(prompt: string): Promise<unknown> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        temperature: this.temperature,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You return valid JSON only. Do not include Markdown or commentary.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter request failed (${response.status}): ${body}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter returned an empty response");
    }

    return parseJsonObject(content);
  }
}
