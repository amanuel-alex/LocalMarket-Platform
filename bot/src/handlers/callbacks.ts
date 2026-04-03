import type TelegramBot from "node-telegram-bot-api";

import { config } from "../config.js";
import { api, ApiError } from "../services/api.client.js";
import { rulesAssistantCaption, PARSE_MODE as ASSIST_PARSE } from "../services/assistant-reply.js";
import { sendProductPage, sendProductSummaries } from "../services/product-messages.js";
import { getSession, getAuth, clearAssistant } from "../services/user-session.js";
import {
  mainMenuKeyboard,
  shopHubKeyboard,
  categoryKeyboard,
  backMenuRow,
  assistantSuggestKeyboard,
} from "../utils/keyboards.js";
import {
  escapeHtml,
  formatProductCaption,
  imageUrlForTelegram,
  ordersWebUrl,
  PARSE_MODE,
  productWebUrl,
  registerDeliveryUrl,
  registerSellerUrl,
} from "../utils/format.js";

const WELCOME =
  "👋 <b>Welcome to EthioLocal</b>\n\nDiscover and buy products near you — <i>smarter</i>.\n\nChoose an option below:";

async function answerCb(bot: TelegramBot, id: string, text?: string): Promise<void> {
  try {
    await bot.answerCallbackQuery(id, { text: text?.slice(0, 200) });
  } catch {
    /* ignore expired */
  }
}

export function registerCallbackHandler(bot: TelegramBot): void {
  bot.on("callback_query", async (query) => {
    const msg = query.message;
    const data = query.data;
    if (!msg || !data || query.from?.id == null) return;

    const chatId = msg.chat.id;
    const s = getSession(chatId);

    try {
      if (data === "menu:main") {
        await answerCb(bot, query.id);
        await bot.sendMessage(chatId, WELCOME, {
          parse_mode: PARSE_MODE,
          reply_markup: { inline_keyboard: mainMenuKeyboard },
        });
        return;
      }

      if (data === "menu:shop") {
        await answerCb(bot, query.id, "Shop");
        await bot.sendMessage(chatId, "🛒 <b>Shop hub</b>\nPick how you want to explore:", {
          parse_mode: PARSE_MODE,
          reply_markup: { inline_keyboard: shopHubKeyboard() },
        });
        return;
      }

      if (data === "shop:categories") {
        await answerCb(bot, query.id);
        const ranked = await api.ranked({
          lat: s.lat ?? config.defaultLat,
          lng: s.lng ?? config.defaultLng,
          limit: 80,
        });
        const set = new Set<string>();
        for (const p of ranked.products) set.add(p.category);
        s.categories = [...set].slice(0, config.maxCategoriesShown).sort();
        if (s.categories.length === 0) {
          await bot.sendMessage(chatId, "No categories yet — check back soon.", {
            reply_markup: { inline_keyboard: [backMenuRow()] },
          });
          return;
        }
        await bot.sendMessage(chatId, "📂 <b>Choose a category</b>", {
          parse_mode: PARSE_MODE,
          reply_markup: { inline_keyboard: categoryKeyboard(s.categories) },
        });
        return;
      }

      if (data === "shop:trending") {
        await answerCb(bot, query.id, "Trending");
        const ranked = await api.ranked({
          lat: s.lat ?? config.defaultLat,
          lng: s.lng ?? config.defaultLng,
          limit: config.productsPerPage,
        });
        await sendProductSummaries(
          bot,
          chatId,
          ranked.products,
          "🔥 <b>Trending picks near you</b>\n<i>Ranked by price, distance, popularity & trust.</i>",
        );
        return;
      }

      if (data === "shop:near") {
        await answerCb(bot, query.id);
        if (s.lat == null || s.lng == null) {
          await bot.sendMessage(
            chatId,
            "📍 <b>Near you</b>\n\nSend your live location (attachment → Location) first, then tap again from the shop hub.",
            { parse_mode: PARSE_MODE, reply_markup: { inline_keyboard: [backMenuRow()] } },
          );
          return;
        }
        const ranked = await api.ranked({ lat: s.lat, lng: s.lng, limit: config.productsPerPage });
        await sendProductSummaries(
          bot,
          chatId,
          ranked.products,
          "📍 <b>Closest picks for you</b>",
        );
        return;
      }

      if (data.startsWith("cat:")) {
        await answerCb(bot, query.id);
        const idx = Number(data.slice(4));
        const cat = s.categories[idx];
        if (!cat) return;
        s.browseCategory = cat;
        s.browsePage = 0;
        await sendBrowsePage(bot, chatId, s);
        return;
      }

      if (data.startsWith("br:p:")) {
        await answerCb(bot, query.id);
        s.browsePage = Number(data.slice(5));
        await sendBrowsePage(bot, chatId, s);
        return;
      }

      if (data === "menu:search") {
        await answerCb(bot, query.id);
        s.awaitingSearchQuery = true;
        clearAssistant(chatId);
        await bot.sendMessage(
          chatId,
          "🔍 <b>Search</b>\n\nType what you’re looking for (e.g. <code>coffee teff spices</code>).",
          { parse_mode: PARSE_MODE },
        );
        return;
      }

      if (data === "menu:ai") {
        await answerCb(bot, query.id);
        s.assistantActive = true;
        s.awaitingSearchQuery = false;
        s.assistantHistory = [];
        await bot.sendMessage(
          chatId,
          "🤖 <b>AI Assistant</b>\n\nChat with EthioLocal — I can search the catalog and explain how things work.\n\n<i>Quick suggestions on your keyboard below.</i>",
          {
            parse_mode: PARSE_MODE,
            reply_markup: assistantSuggestKeyboard(),
          },
        );
        return;
      }

      if (data === "menu:orders") {
        await answerCb(bot, query.id);
        const auth = getAuth(chatId);
        if (!auth) {
          await bot.sendMessage(
            chatId,
            `📦 <b>My Orders</b>\n\nLink your account with <code>/link</code> (phone → password), or open the web app:\n${ordersWebUrl()}`,
            { parse_mode: PARSE_MODE, reply_markup: { inline_keyboard: [backMenuRow()] } },
          );
          return;
        }
        try {
          const { orders } = await api.ordersList(auth.accessToken);
          if (orders.length === 0) {
            await bot.sendMessage(chatId, "You have no orders yet. 🛒 Browse the shop!", {
              reply_markup: { inline_keyboard: [backMenuRow()] },
            });
            return;
          }
          const lines = orders.slice(0, 15).map((o) => {
            const icon =
              o.status === "completed"
                ? "✅"
                : o.status === "paid"
                  ? "💳"
                  : o.status === "pending"
                    ? "⏳"
                    : "📦";
            return `${icon} <b>${escapeHtml(o.product.title)}</b> · ${o.totalPrice} ETB · <i>${escapeHtml(o.status)}</i>`;
          });
          await bot.sendMessage(chatId, `📦 <b>Your orders</b>\n\n${lines.join("\n")}`, {
            parse_mode: PARSE_MODE,
            reply_markup: {
              inline_keyboard: [
                [{ text: "🌐 Open orders on web", url: ordersWebUrl() }],
                backMenuRow(),
              ],
            },
          });
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            await bot.sendMessage(chatId, "Session expired — use /link again.", {
              reply_markup: { inline_keyboard: [backMenuRow()] },
            });
          } else throw e;
        }
        return;
      }

      if (data === "menu:seller") {
        await answerCb(bot, query.id);
        await bot.sendMessage(
          chatId,
          "🏪 <b>Become a seller</b>\n\nList products, manage orders, and get paid with EthioLocal escrow.\n\nApply on the web — admins review each shop.",
          {
            parse_mode: PARSE_MODE,
            reply_markup: {
              inline_keyboard: [
                [{ text: "✨ Open seller registration", url: registerSellerUrl() }],
                backMenuRow(),
              ],
            },
          },
        );
        return;
      }

      if (data === "menu:delivery") {
        await answerCb(bot, query.id);
        await bot.sendMessage(
          chatId,
          "🚚 <b>Delivery partner</b>\n\nAccept assignments, scan QR handoffs, and grow with trusted sellers.",
          {
            parse_mode: PARSE_MODE,
            reply_markup: {
              inline_keyboard: [
                [{ text: "✨ Open delivery signup", url: registerDeliveryUrl() }],
                backMenuRow(),
              ],
            },
          },
        );
        return;
      }

      if (data === "menu:lochelp") {
        await answerCb(bot, query.id);
        await bot.sendMessage(
          chatId,
          "📍 <b>Location</b>\n\nIn Telegram: tap the <b>clip</b> → <b>Location</b> → send your live location.\n\nThen use <b>Near you</b> or ask the AI for “near me”.",
          { parse_mode: PARSE_MODE, reply_markup: { inline_keyboard: [backMenuRow()] } },
        );
        return;
      }

      if (data.startsWith("pd:")) {
        await answerCb(bot, query.id);
        const id = data.slice(3);
        const { product } = await api.getProduct(id);
        const cap = `${formatProductCaption(product)}\n\n${escapeHtml(product.description.slice(0, 350))}${product.description.length > 350 ? "…" : ""}`;
        const img = imageUrlForTelegram(product.imageUrl);
        const kb = [
          [{ text: "🛍️ Buy on EthioLocal", url: productWebUrl(product.id) }],
          backMenuRow(),
        ];
        if (img) await bot.sendPhoto(chatId, img, { caption: cap, parse_mode: PARSE_MODE, reply_markup: { inline_keyboard: kb } });
        else await bot.sendMessage(chatId, cap, { parse_mode: PARSE_MODE, reply_markup: { inline_keyboard: kb } });
        return;
      }

      if (data.startsWith("buy:")) {
        await answerCb(bot, query.id, "Opening web…");
        const id = data.slice(4);
        await bot.sendMessage(chatId, `🛍️ <a href="${productWebUrl(id)}">Open product checkout on the web</a>`, {
          parse_mode: PARSE_MODE,
          reply_markup: { inline_keyboard: [backMenuRow()] },
        });
        return;
      }

      if (data.startsWith("cmp:")) {
        await answerCb(bot, query.id);
        const id = data.slice(4);
        const { products } = await api.compareProduct(id);
        if (products.length <= 1) {
          await bot.sendMessage(chatId, "No other sellers for this item yet.", {
            reply_markup: { inline_keyboard: [backMenuRow()] },
          });
          return;
        }
        await bot.sendMessage(chatId, "⚖️ <b>Price compare</b>\nSame catalog group, sorted by price:", {
          parse_mode: PARSE_MODE,
        });
        for (const p of products.slice(0, 6)) {
          await bot.sendMessage(chatId, formatProductCaption(p), {
            parse_mode: PARSE_MODE,
            reply_markup: {
              inline_keyboard: [[{ text: "🛍️ View", url: productWebUrl(p.id) }], backMenuRow()],
            },
          });
        }
        return;
      }
    } catch (e) {
      console.error(e);
      await answerCb(bot, query.id, "Error");
      await bot.sendMessage(
        chatId,
        "⚠️ Something went wrong. Is the API running?\n<code>" + escapeHtml(e instanceof Error ? e.message : "Error") + "</code>",
        { parse_mode: PARSE_MODE },
      );
    }
  });
}

async function sendBrowsePage(bot: TelegramBot, chatId: number, s: ReturnType<typeof getSession>): Promise<void> {
  const cat = s.browseCategory;
  if (!cat) return;
  const page = s.browsePage + 1;
  const { products, totalPages } = await api.listProducts(page, config.productsPerPage, cat);
  await sendProductPage(
    bot,
    chatId,
    products,
    s.browsePage,
    totalPages,
    "br",
    `📂 <b>${escapeHtml(cat)}</b> · page ${page}/${Math.max(1, totalPages)}`,
  );
}
