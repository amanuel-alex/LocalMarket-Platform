import {
  FunctionCallingMode,
  GoogleGenerativeAI,
  SchemaType,
  type FunctionDeclaration,
  type Tool,
} from "@google/generative-ai";

import { getEnv } from "../config/env.js";
import type { AssistantOpenaiChatInput } from "../schemas/assistant.schemas.js";
import type { AssistantProductJson } from "./assistant.service.js";
import { AppError } from "../utils/errors.js";
import { runAssistantTool } from "./assistant.tools.executor.js";

const MAX_TOOL_ROUNDS = 6;

const searchMarketplaceDecl: FunctionDeclaration = {
  name: "search_local_marketplace",
  description:
    "Query the live EthioLocal product catalog using natural-language shopping intent (e.g. cheap coffee nearby, best teff, spices under 500 ETB). Uses the same ranking as the app: price, distance when lat/lng provided, popularity and trust when user asks for best/recommended.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      shopping_query: {
        type: SchemaType.STRING,
        description: "Short phrase capturing what the user wants to buy and any constraints.",
      },
    },
    required: ["shopping_query"],
  },
};

const platformFactDecl: FunctionDeclaration = {
  name: "get_platform_fact",
  description:
    "Return fixed help about EthioLocal (QR pickup, escrow/payments, how comparison works). Use when the user asks how something works, not for product search.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      topic: {
        type: SchemaType.STRING,
        format: "enum",
        enum: ["qr_pickup", "escrow", "compare_prices", "general"],
        description: "Which help topic to return.",
      },
    },
    required: ["topic"],
  },
};

const geminiTools: Tool[] = [
  { functionDeclarations: [searchMarketplaceDecl, platformFactDecl] },
];

function buildSystemPrompt(): string {
  return [
    "You are EthioLocal’s helpful marketplace assistant for local commerce in Ethiopia.",
    "Currency is ETB. Be concise, friendly, and practical.",
    "When users want products, deals, nearby items, or recommendations, call search_local_marketplace with a focused shopping_query.",
    "For questions about QR pickup, escrow, or how the platform works without needing live data, call get_platform_fact.",
    "After tool results: summarize in plain language; if products were returned, mention a few titles with ETB prices and one useful tip (e.g. distance or “lowest price”).",
    "If the catalog is empty, explain briefly and suggest broadening the search or checking back later.",
  ].join(" ");
}

function parseFunctionResponseContent(content: string): object {
  try {
    return JSON.parse(content) as object;
  } catch {
    return { raw: content };
  }
}

export function isGeminiAssistantEnabled(): boolean {
  const key = getEnv().GOOGLE_AI_API_KEY?.trim();
  return Boolean(key && key.length > 0);
}

export type GeminiAssistantChatResult = {
  reply: string;
  model: string;
  products: AssistantProductJson[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

export async function runGeminiAssistantChat(
  input: AssistantOpenaiChatInput,
): Promise<GeminiAssistantChatResult> {
  if (!isGeminiAssistantEnabled()) {
    throw new AppError(
      503,
      "GEMINI_DISABLED",
      "Google AI (Gemini) assistant is not configured (missing GOOGLE_AI_API_KEY from Google AI Studio).",
    );
  }

  const env = getEnv();
  const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
  const modelName = env.GEMINI_MODEL;

  const model = genAI.getGenerativeModel({
    model: modelName,
    tools: geminiTools,
    toolConfig: {
      functionCallingConfig: { mode: FunctionCallingMode.AUTO },
    },
    systemInstruction: buildSystemPrompt(),
  });

  const geo = { lat: input.lat, lng: input.lng };
  let lastCatalogProducts: AssistantProductJson[] = [];

  const history = input.history.map((t) => ({
    role: t.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: t.content }],
  }));

  const chat = model.startChat({ history });

  let result = await chat.sendMessage(input.message);
  let lastUsage: GeminiAssistantChatResult["usage"];
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds += 1;
    const response = result.response;
    const um = response.usageMetadata;
    if (um) {
      lastUsage = {
        prompt_tokens: um.promptTokenCount,
        completion_tokens: um.candidatesTokenCount,
        total_tokens: um.totalTokenCount,
      };
    }

    const calls = response.functionCalls();
    if (!calls?.length) {
      const text = response.text()?.trim();
      if (!text) {
        throw new AppError(502, "GEMINI_EMPTY", "Assistant returned an empty response.");
      }
      return {
        reply: text,
        model: modelName,
        products: lastCatalogProducts.slice(0, 8),
        usage: lastUsage,
      };
    }

    const responseParts: { functionResponse: { name: string; response: object } }[] = [];
    for (const call of calls) {
      const rawArgs = JSON.stringify(call.args ?? {});
      const { content, catalogProducts } = await runAssistantTool(call.name, rawArgs, geo);
      if (catalogProducts?.length) {
        lastCatalogProducts = catalogProducts;
      }
      responseParts.push({
        functionResponse: {
          name: call.name,
          response: parseFunctionResponseContent(content),
        },
      });
    }

    result = await chat.sendMessage(responseParts);
  }

  throw new AppError(502, "GEMINI_TOOL_LOOP", "Assistant exceeded maximum tool rounds.");
}
