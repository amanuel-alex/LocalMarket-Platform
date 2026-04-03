import type TelegramBot from "node-telegram-bot-api";

import { mainMenuKeyboard } from "../utils/keyboards.js";
import { PARSE_MODE } from "../utils/format.js";
import {
  clearAssistant,
  clearAuth,
  getSession,
  replyKeyboardRemove,
} from "../services/user-session.js";

const WELCOME =
  "👋 <b>Welcome to EthioLocal</b>\n\nDiscover and buy products near you — <i>smarter</i>.\n\nChoose an option below:";

export function registerCommandHandlers(bot: TelegramBot): void {
  bot.onText(/^\/start(?:\s+.*)?$/, (msg) => {
    const chatId = msg.chat.id;
    clearAssistant(chatId);
    void bot.sendMessage(chatId, WELCOME, {
      parse_mode: PARSE_MODE,
      reply_markup: { inline_keyboard: mainMenuKeyboard },
    });
  });

  bot.onText(/^\/menu$/, (msg) => {
    const chatId = msg.chat.id;
    void bot.sendMessage(chatId, WELCOME, {
      parse_mode: PARSE_MODE,
      reply_markup: { inline_keyboard: mainMenuKeyboard },
    });
  });

  bot.onText(/^\/link$/, (msg) => {
    const chatId = msg.chat.id;
    const s = getSession(chatId);
    s.linkStep = "phone";
    s.pendingPhone = undefined;
    void bot.sendMessage(
      chatId,
      "🔐 <b>Link your EthioLocal account</b>\n\nSend your <b>phone</b> or <b>email</b> (one message).\n\n<i>We only store access tokens on this bot session — use a test account in dev.</i>",
      { parse_mode: PARSE_MODE },
    );
  });

  bot.onText(/^\/unlink$/, (msg) => {
    const chatId = msg.chat.id;
    clearAuth(chatId);
    getSession(chatId).linkStep = "idle";
    void bot.sendMessage(chatId, "✅ Session cleared. /link again anytime.", {
      reply_markup: replyKeyboardRemove(),
    });
  });

  bot.onText(/^\/help$/, (msg) => {
    void bot.sendMessage(
      msg.chat.id,
      [
        "<b>EthioLocal Bot</b>",
        "",
        "/start — main menu",
        "/menu — same",
        "/link — connect orders (phone → password)",
        "/unlink — clear tokens",
        "/help — this message",
        "",
        "Tip: share 📍 location for “Near you” & smarter AI picks.",
      ].join("\n"),
      { parse_mode: PARSE_MODE },
    );
  });
}
