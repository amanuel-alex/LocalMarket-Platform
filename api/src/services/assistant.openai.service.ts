import OpenAI from "openai";

import { getEnv } from "../config/env.js";
import type { AssistantOpenaiChatInput } from "../schemas/assistant.schemas.js";
import { AppError } from "../utils/errors.js";
import { runAssistantTool } from "./assistant.tools.executor.js";

const MAX_TOOL_ROUNDS = 6;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_local_marketplace",
      description:
        "Query the live EthioLocal product catalog using natural-language shopping intent (e.g. cheap coffee nearby, best teff, spices under 500 ETB). Uses the same ranking as the app: price, distance when lat/lng provided, popularity and trust when user asks for best/recommended.",
      parameters: {
        type: "object",
        properties: {
          shopping_query: {
            type: "string",
            description: "Short phrase capturing what the user wants to buy and any constraints.",
          },
        },
        required: ["shopping_query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_platform_fact",
      description:
        "Return fixed help about EthioLocal (QR pickup, escrow/payments, how comparison works). Use when the user asks how something works, not for product search.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            enum: ["qr_pickup", "escrow", "compare_prices", "general"],
            description: "Which help topic to return.",
          },
        },
        required: ["topic"],
      },
    },
  },
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

export function isOpenAiAssistantEnabled(): boolean {
  const key = getEnv().OPENAI_API_KEY?.trim();
  return Boolean(key && key.length > 0);
}

export type OpenAiAssistantChatResult = {
  reply: string;
  model: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

export async function runOpenAiAssistantChat(
  input: AssistantOpenaiChatInput,
): Promise<OpenAiAssistantChatResult> {
  if (!isOpenAiAssistantEnabled()) {
    throw new AppError(503, "OPENAI_DISABLED", "OpenAI assistant is not configured (missing OPENAI_API_KEY).");
  }

  const env = getEnv();
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const model = env.OPENAI_MODEL;

  const geo = { lat: input.lat, lng: input.lng };

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt() },
    ...input.history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: input.message },
  ];

  let rounds = 0;
  let lastUsage: OpenAiAssistantChatResult["usage"];

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds += 1;
    const completion = await client.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.5,
      max_tokens: 900,
    });

    const choice = completion.choices[0];
    lastUsage = completion.usage
      ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
        }
      : undefined;

    if (!choice?.message) {
      throw new AppError(502, "OPENAI_EMPTY", "Assistant returned an empty response.");
    }

    const msg = choice.message;
    messages.push(msg);

    const toolCalls = msg.tool_calls;
    if (!toolCalls?.length) {
      const text = msg.content?.trim();
      if (!text) {
        throw new AppError(502, "OPENAI_EMPTY", "Assistant returned no text.");
      }
      return { reply: text, model, usage: lastUsage };
    }

    for (const call of toolCalls) {
      if (call.type !== "function") continue;
      const { content } = await runAssistantTool(call.function.name, call.function.arguments, geo);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content,
      });
    }
  }

  throw new AppError(502, "OPENAI_TOOL_LOOP", "Assistant exceeded maximum tool rounds.");
}
