import type { AssistantRulesResult } from "../types/api.js";
import { escapeHtml, PARSE_MODE } from "../utils/format.js";

export function rulesAssistantCaption(data: AssistantRulesResult): string {
  const { intents } = data;
  const hints: string[] = [];

  if (intents.nearbyMissingCoordinates) {
    hints.push("📍 <i>Share your location (paperclip → Location) for “near me” results.</i>");
  }
  if (intents.smartRankingMissingCoordinates) {
    hints.push("🎯 <i>Share location for smarter trending / best picks.</i>");
  }
  if (intents.category) {
    hints.push(`🔎 Filtered category: <b>${escapeHtml(intents.category)}</b>`);
  }

  const n = data.products.length;
  let head = "✨ <b>Here’s what I found</b>\n";
  if (n === 0) {
    head += "\nNo listings matched yet — try broader words or another category.";
  } else {
    head += `\n<b>${n}</b> listing${n === 1 ? "" : "s"} · mode: <code>${escapeHtml(data.assistantMode)}</code>`;
  }

  const tail = hints.length ? `\n\n${hints.join("\n")}` : "";
  return head + tail;
}

export { PARSE_MODE };
