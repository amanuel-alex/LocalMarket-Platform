import type TelegramBot from "node-telegram-bot-api";

export const mainMenuKeyboard: TelegramBot.InlineKeyboardButton[][] = [
  [{ text: "🛒 Shop Products", callback_data: "menu:shop" }],
  [{ text: "🔍 Search", callback_data: "menu:search" }],
  [{ text: "🤖 AI Assistant", callback_data: "menu:ai" }],
  [{ text: "📦 My Orders", callback_data: "menu:orders" }],
  [
    { text: "🏪 Become Seller", callback_data: "menu:seller" },
    { text: "🚚 Delivery Partner", callback_data: "menu:delivery" },
  ],
  [{ text: "📍 Share location (for Near You)", callback_data: "menu:lochelp" }],
];

export function backMenuRow(): TelegramBot.InlineKeyboardButton[] {
  return [{ text: "🏠 Main menu", callback_data: "menu:main" }];
}

export function shopHubKeyboard(): TelegramBot.InlineKeyboardButton[][] {
  return [
    [{ text: "📂 Browse by category", callback_data: "shop:categories" }],
    [{ text: "🔥 Trending picks", callback_data: "shop:trending" }],
    [{ text: "📍 Near you", callback_data: "shop:near" }],
    ...mainMenuKeyboard.slice(-1),
    backMenuRow(),
  ];
}

export function categoryKeyboard(categories: string[]): TelegramBot.InlineKeyboardButton[][] {
  const rows: TelegramBot.InlineKeyboardButton[][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    const row: TelegramBot.InlineKeyboardButton[] = [
      { text: `📁 ${categories[i]}`, callback_data: `cat:${i}` },
    ];
    if (categories[i + 1]) {
      row.push({ text: `📁 ${categories[i + 1]}`, callback_data: `cat:${i + 1}` });
    }
    rows.push(row);
  }
  rows.push(backMenuRow());
  rows.push([{ text: "⬅️ Shop hub", callback_data: "menu:shop" }]);
  return rows;
}

export function productRow(productId: string): TelegramBot.InlineKeyboardButton[] {
  return [
    { text: "🔎 Details", callback_data: `pd:${productId}` },
    { text: "🛍️ Buy on web", callback_data: `buy:${productId}` },
    { text: "⚖️ Compare", callback_data: `cmp:${productId}` },
  ];
}

export function paginationRow(page: number, hasMore: boolean, prefix: string): TelegramBot.InlineKeyboardButton[] {
  const row: TelegramBot.InlineKeyboardButton[] = [];
  if (page > 0) row.push({ text: "⬅️ Prev", callback_data: `${prefix}:p:${page - 1}` });
  if (hasMore) row.push({ text: "Next ➡️", callback_data: `${prefix}:p:${page + 1}` });
  return row;
}

export function assistantSuggestKeyboard(): TelegramBot.ReplyKeyboardMarkup {
  return {
    keyboard: [
      [{ text: "🔥 Trending near me" }, { text: "💸 Cheapest deals" }],
      [{ text: "❓ How does QR pickup work?" }, { text: "🏠 Main menu" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}
