import {
  edgeTypes,
  nodeTypes,
  validateContextGraph,
  type ContextGraph,
  type EdgeType,
  type NodeType,
} from "@graphctx/graph-schema";
import { config as loadEnv } from "dotenv";
import type { LlmClient, LlmProvider } from "./llmClient.js";
import { OpenAiClient } from "./openaiClient.js";
import { OpenRouterClient } from "./openRouterClient.js";
import { buildExtractionPrompt } from "./prompts.js";

loadEnv();

export type ExtractGraphOptions = {
  provider?: LlmProvider;
  model?: string;
  maxInputChars?: number;
  temperature?: number;
  client?: LlmClient;
};

export type CreateLlmClientOptions = {
  provider?: LlmProvider;
  model?: string;
  temperature?: number;
  client?: LlmClient;
};

function positiveIntegerFromEnv(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createLlmClient(options: CreateLlmClientOptions = {}): {
  client: LlmClient;
  provider: LlmProvider;
  model: string;
} {
  const provider = options.provider ?? (process.env.LLM_PROVIDER as LlmProvider | undefined) ?? "openai";

  if (options.client) {
    return { client: options.client, provider, model: options.model ?? "custom-client" };
  }

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = options.model ?? process.env.OPENROUTER_MODEL ?? "openai/gpt-4.1-mini";
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is required when LLM_PROVIDER=openrouter");
    }
    return {
      provider,
      model,
      client: new OpenRouterClient({ apiKey, model, temperature: options.temperature }),
    };
  }

  if (provider !== "openai") {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when LLM_PROVIDER=openai");
  }

  return {
    provider,
    model,
    client: new OpenAiClient({ apiKey, model, temperature: options.temperature }),
  };
}

const nodeTypeAliases: Record<string, NodeType> = {
  action: "task",
  actions: "task",
  blocker: "risk",
  constraint: "risk",
  evidence: "source",
  finding: "source",
  goal: "summary",
  goals: "summary",
  insight: "idea",
  issue: "risk",
  next_action: "task",
  next_step: "task",
  outcome: "summary",
  requirement: "idea",
  success: "summary",
  success_criteria: "summary",
};

const edgeTypeAliases: Record<string, EdgeType> = {
  blocks: "contradicts",
  causes: "leads_to",
  informs: "supports",
  relates_to: "expands",
  requires: "depends_on",
};

function normalizeType<T extends string>(
  value: unknown,
  allowed: readonly T[],
  aliases: Record<string, T>,
  fallback: T,
): T {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.toLowerCase().trim().replace(/[\s-]+/g, "_");
  return allowed.includes(normalized as T) ? (normalized as T) : aliases[normalized] ?? fallback;
}

function normalizeExtractedGraph(input: unknown): unknown {
  if (typeof input !== "object" || input === null) {
    return input;
  }

  const graph = input as { nodes?: unknown; edges?: unknown };

  return {
    ...graph,
    nodes: Array.isArray(graph.nodes)
      ? graph.nodes.map((node) => {
          if (typeof node !== "object" || node === null) {
            return node;
          }
          return {
            ...node,
            type: normalizeType((node as { type?: unknown }).type, nodeTypes, nodeTypeAliases, "idea"),
          };
        })
      : graph.nodes,
    edges: Array.isArray(graph.edges)
      ? graph.edges.map((edge) => {
          if (typeof edge !== "object" || edge === null) {
            return edge;
          }
          return {
            ...edge,
            type: normalizeType((edge as { type?: unknown }).type, edgeTypes, edgeTypeAliases, "expands"),
          };
        })
      : graph.edges,
  };
}

export async function extractGraph(input: string, options: ExtractGraphOptions = {}): Promise<ContextGraph> {
  const maxInputChars =
    options.maxInputChars ?? positiveIntegerFromEnv(process.env.GRAPHCTX_MAX_INPUT_CHARS, 120000);
  const trimmedInput = input.length > maxInputChars ? input.slice(0, maxInputChars) : input;
  const { client, provider, model } = createLlmClient(options);
  const prompt = buildExtractionPrompt(trimmedInput);
  const rawGraph = normalizeExtractedGraph(await client.completeJson(prompt));

  const validation = validateContextGraph({
    ...(typeof rawGraph === "object" && rawGraph !== null ? rawGraph : {}),
    metadata: {
      ...(typeof rawGraph === "object" && rawGraph !== null && "metadata" in rawGraph
        ? (rawGraph as { metadata?: object }).metadata
        : {}),
      generated_at: new Date().toISOString(),
      model: `${provider}/${model}`,
      input_chars: trimmedInput.length,
      version: "phase-1",
    },
  });

  if (!validation.ok || !validation.graph) {
    throw new Error(`Extracted graph failed validation:\n${validation.errors.join("\n")}`);
  }

  return validation.graph;
}
