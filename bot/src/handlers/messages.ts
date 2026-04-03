import type TelegramBot from "node-telegram-bot-api";

import { config } from "../config.js";
import { api, ApiError } from "../services/api.client.js";
import { rulesAssistantCaption } from "../services/assistant-reply.js";
import { sendProductSummaries } from "../services/product-messages.js";
import { getSession, setAuth, clearAssistant } from "../services/user-session.js";
import { mainMenuKeyboard } from "../utils/keyboards.js";
import { escapeHtml, PARSE_MODE } from "../utils/format.js";

const WELCOME =
  "👋 <b>Welcome to EthioLocal</b>\n\nDiscover and buy products near you — <i>smarter</i>.\n\nChoose an option below:";

export function registerMessageHandlers(bot: TelegramBot): void {
  bot.on("location", (msg) => {
    const chatId = msg.chat.id;
    const loc = msg.location;
    if (!loc) return;
    const s = getSession(chatId);
    s.lat = loc.latitude;
    s.lng = loc.longitude;
    void bot.sendMessage(
      chatId,
      "📍 <b>Got it.</b> “Near you”, trending, and the AI can use this now.",
      { parse_mode: PARSE_MODE },
    );
  });

  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;
    const chatId = msg.chat.id;
    const s = getSession(chatId);
    const text = msg.text.trim();

    if (text === "🏠 Main menu") {
      clearAssistant(chatId);
      s.awaitingSearchQuery = false;
      s.linkStep = "idle";
      await bot.sendMessage(chatId, WELCOME, {
        parse_mode: PARSE_MODE,
        reply_markup: { remove_keyboard: true },
      });
      await bot.sendMessage(chatId, "⬇️", {
        reply_markup: { inline_keyboard: mainMenuKeyboard },
      });
      return;
    }

    if (s.linkStep === "phone") {
      s.pendingPhone = text;
      s.linkStep = "password";
      await bot.sendMessage(chatId, "Now send your <b>password</b> (this chat is private — still, use a test account in dev).", {
        parse_mode: PARSE_MODE,
      });
      return;
    }

    if (s.linkStep === "password") {
      const phone = s.pendingPhone;
      if (!phone) {
        s.linkStep = "idle";
        return;
      }
      try {
        const auth = await api.login(phone, text);
        setAuth(chatId, {
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          user: {
            id: auth.user.id,
            name: auth.user.name,
            role: auth.user.role,
            phone: auth.user.phone,
          },
        });
        s.linkStep = "idle";
        s.pendingPhone = undefined;
        await bot.sendMessage(chatId, `✅ Linked as <b>${escapeHtml(auth.user.name)}</b> (${escapeHtml(auth.user.role)}).`, {
          parse_mode: PARSE_MODE,
          reply_markup: { remove_keyboard: true },
        });
      } catch (e) {
        s.linkStep = "idle";
        s.pendingPhone = undefined;
        const m = e instanceof ApiError ? e.message : "Login failed";
        await bot.sendMessage(chatId, `❌ ${escapeHtml(m)}`, { parse_mode: PARSE_MODE });
      }
      return;
    }

    if (s.awaitingSearchQuery) {
      s.awaitingSearchQuery = false;
      try {
        const { products } = await api.search(text, s.lat, s.lng);
        await sendProductSummaries(
          bot,
          chatId,
          products,
          `🔍 <b>Results for</b> “${escapeHtml(text)}”`,
        );
      } catch (e) {
        await bot.sendMessage(
          chatId,
          "Search failed: " + escapeHtml(e instanceof Error ? e.message : "error"),
          { parse_mode: PARSE_MODE },
        );
      }
      return;
    }

    if (s.assistantActive) {
      await handleAssistantTurn(bot, chatId, s, text);
      return;
    }
  });
}

async function handleAssistantTurn(
  bot: TelegramBot,
  chatId: number,
  s: ReturnType<typeof getSession>,
  text: string,
): Promise<void> {
  const lat = s.lat ?? config.defaultLat;
  const lng = s.lng ?? config.defaultLng;

  if (text === "🔥 Trending near me") {
    try {
      const ranked = await api.ranked({ lat, lng, limit: config.productsPerPage });
      await sendProductSummaries(bot, chatId, ranked.products, "🔥 <b>Trending near you</b>");
    } catch (e) {
      await bot.sendMessage(chatId, escapeHtml(e instanceof Error ? e.message : "err"), { parse_mode: PARSE_MODE });
    }
    return;
  }

  if (text === "💸 Cheapest deals") {
    try {
      const data = await api.assistantChat({ message: "show me cheap affordable deals lowest price", lat, lng });
      await bot.sendMessage(chatId, rulesAssistantCaption(data), { parse_mode: PARSE_MODE });
      await sendProductSummaries(bot, chatId, data.products.slice(0, config.productsPerPage), "💸 <b>Deals</b>");
    } catch (e) {
      await bot.sendMessage(chatId, escapeHtml(e instanceof Error ? e.message : "err"), { parse_mode: PARSE_MODE });
    }
    return;
  }

  if (text === "❓ How does QR pickup work?") {
    try {
      const data = await api.assistantChat({ message: "how does qr pickup work escrow", lat, lng });
      await bot.sendMessage(chatId, rulesAssistantCaption(data), { parse_mode: PARSE_MODE });
    } catch (e) {
      await bot.sendMessage(chatId, escapeHtml(e instanceof Error ? e.message : "err"), { parse_mode: PARSE_MODE });
    }
    return;
  }

  try {
    const status = await api.geminiStatus();
    if (status.enabled) {
      s.assistantHistory.push({ role: "user", content: text });
      const hist = s.assistantHistory.slice(-10);
      const res = await api.geminiChat({
        message: text,
        history: hist.slice(0, -1),
        lat: s.lat,
        lng: s.lng,
      });
      s.assistantHistory.push({ role: "assistant", content: res.reply });
      await bot.sendMessage(chatId, `🤖 ${escapeHtml(res.reply)}`, { parse_mode: PARSE_MODE });
      if (res.products?.length) {
        await sendProductSummaries(
          bot,
          chatId,
          res.products.slice(0, config.productsPerPage),
          "✨ <b>From the catalog</b>",
        );
      }
      return;
    }
  } catch {
    /* fall through to rules */
  }

  try {
    const data = await api.assistantChat({ message: text, lat: s.lat, lng: s.lng });
    await bot.sendMessage(chatId, rulesAssistantCaption(data), { parse_mode: PARSE_MODE });
    if (data.products.length) {
      await sendProductSummaries(
        bot,
        chatId,
        data.products.slice(0, config.productsPerPage),
        "✨ <b>Top matches</b>",
      );
    }
  } catch (e) {
    await bot.sendMessage(chatId, escapeHtml(e instanceof Error ? e.message : "err"), { parse_mode: PARSE_MODE });
  }
}
