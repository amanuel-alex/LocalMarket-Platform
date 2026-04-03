import TelegramBot from "node-telegram-bot-api";

import { config } from "./config.js";
import { registerCallbackHandler } from "./handlers/callbacks.js";
import { registerCommandHandlers } from "./handlers/commands.js";
import { registerMessageHandlers } from "./handlers/messages.js";

console.log("EthioLocal Telegram bot starting…");
console.log("API:", config.apiBaseUrl);
console.log("Web:", config.webBaseUrl);

const bot = new TelegramBot(config.telegramBotToken, { polling: true });

registerCommandHandlers(bot);
registerCallbackHandler(bot);
registerMessageHandlers(bot);

bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
});

console.log("Bot is live. Press Ctrl+C to stop.");
