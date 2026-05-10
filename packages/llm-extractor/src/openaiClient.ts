import OpenAI from "openai";
import type { LlmClient } from "./llmClient.js";
import { parseJsonObject } from "./repairJson.js";

export class OpenAiClient implements LlmClient {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly temperature: number;

  constructor(options: { apiKey: string; model: string; temperature?: number }) {
    this.client = new OpenAI({ apiKey: options.apiKey });
    this.model = options.model;
    this.temperature = options.temperature ?? 0.2;
  }

  async completeJson(prompt: string): Promise<unknown> {
    const response = await this.client.chat.completions.create({
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
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty response");
    }

    return parseJsonObject(content);
  }
}
