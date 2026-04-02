import { z } from "zod";

import type { AssistantProductJson } from "./assistant.service.js";
import { runAssistantChat } from "./assistant.service.js";

const searchArgsSchema = z.object({
  shopping_query: z.string().min(1).max(2000),
});

const factArgsSchema = z.object({
  topic: z.enum(["qr_pickup", "escrow", "compare_prices", "general"]),
});

function platformFact(topic: z.infer<typeof factArgsSchema>["topic"]): string {
  switch (topic) {
    case "qr_pickup":
      return "After payment, EthioLocal issues a QR token for the order. At pickup, the buyer presents it; the seller verifies in the app so the handoff is recorded and escrow can complete safely.";
    case "escrow":
      return "Payments follow order states: pending → paid → completed after verified pickup. Sellers track payouts from the dashboard; buyers see clear status in their orders.";
    case "compare_prices":
      return "You can browse by category and compare ETB prices across sellers. Ask for “cheap”, “near me”, or “best picks” and I can query live listings for you.";
    case "general":
    default:
      return "EthioLocal links buyers with nearby sellers, highlights competitive prices, and uses QR verification at pickup for trust.";
  }
}

export type AssistantToolRunResult = {
  /** JSON string for OpenAI / parsing for Gemini function responses */
  content: string;
  /** Full catalog rows when search_local_marketplace ran (for mobile product cards) */
  catalogProducts?: AssistantProductJson[];
};

/**
 * Shared tool execution for OpenAI and Google Gemini assistants.
 */
export async function runAssistantTool(
  name: string,
  rawArgs: string,
  geo: { lat?: number; lng?: number },
): Promise<AssistantToolRunResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawArgs || "{}") as unknown;
  } catch {
    return { content: JSON.stringify({ error: "invalid_tool_arguments" }) };
  }

  if (name === "search_local_marketplace") {
    const args = searchArgsSchema.safeParse(parsed);
    if (!args.success) {
      return {
        content: JSON.stringify({ error: "invalid_arguments", details: args.error.flatten() }),
      };
    }
    const result = await runAssistantChat({
      message: args.data.shopping_query,
      lat: geo.lat,
      lng: geo.lng,
    });
    const products = result.products.slice(0, 14).map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      currency: "ETB",
      distanceKm: p.distanceKm,
      rankScore: p.rankScore,
    }));
    return {
      content: JSON.stringify({
        assistantMode: result.assistantMode,
        intents: result.intents,
        productCount: result.products.length,
        products,
      }),
      catalogProducts: result.products,
    };
  }

  if (name === "get_platform_fact") {
    const args = factArgsSchema.safeParse(parsed);
    if (!args.success) {
      return {
        content: JSON.stringify({ error: "invalid_arguments", details: args.error.flatten() }),
      };
    }
    return {
      content: JSON.stringify({ fact: platformFact(args.data.topic) }),
    };
  }

  return { content: JSON.stringify({ error: "unknown_tool", name }) };
}
