import type TelegramBot from "node-telegram-bot-api";

import { config } from "../config.js";
import type { ProductJson } from "../types/api.js";
import { productRow, paginationRow, backMenuRow } from "../utils/keyboards.js";
import { formatProductCaption, imageUrlForTelegram, PARSE_MODE } from "../utils/format.js";

export async function sendProductPage(
  bot: TelegramBot,
  chatId: number,
  products: ProductJson[],
  page: number,
  totalPages: number,
  paginationPrefix: string,
  intro: string,
): Promise<void> {
  await bot.sendMessage(chatId, intro, { parse_mode: PARSE_MODE });

  const slice = products;
  for (const p of slice) {
    const caption = formatProductCaption(p);
    const keyboard = [productRow(p.id), paginationRow(page, page + 1 < totalPages, paginationPrefix)];
    const filtered = keyboard.filter((r) => r.length > 0);
    const opts: TelegramBot.SendPhotoOptions = {
      parse_mode: PARSE_MODE,
      reply_markup: { inline_keyboard: [...filtered, backMenuRow()] },
    };
    const img = imageUrlForTelegram(p.imageUrl);
    if (img) {
      await bot.sendPhoto(chatId, img, { caption, ...opts });
    } else {
      await bot.sendMessage(chatId, caption, { ...opts });
    }
  }

  if (slice.length === 0) {
    await bot.sendMessage(chatId, "No products on this page.", {
      reply_markup: { inline_keyboard: [backMenuRow()] },
    });
  }
}

export async function sendProductSummaries(
  bot: TelegramBot,
  chatId: number,
  products: ProductJson[],
  title: string,
): Promise<void> {
  await bot.sendMessage(chatId, title, { parse_mode: PARSE_MODE });
  const max = Math.min(products.length, config.productsPerPage);
  for (let i = 0; i < max; i += 1) {
    const p = products[i];
    const caption = formatProductCaption(p);
    const img = imageUrlForTelegram(p.imageUrl);
    const keyboard = [productRow(p.id), backMenuRow()];
    if (img) {
      await bot.sendPhoto(chatId, img, {
        caption,
        parse_mode: PARSE_MODE,
        reply_markup: { inline_keyboard: keyboard },
      });
    } else {
      await bot.sendMessage(chatId, caption, {
        parse_mode: PARSE_MODE,
        reply_markup: { inline_keyboard: keyboard },
      });
    }
  }
}
