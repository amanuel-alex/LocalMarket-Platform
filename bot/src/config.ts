import "dotenv/config";

function req(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export const config = {
  telegramBotToken: req("TELEGRAM_BOT_TOKEN"),
  apiBaseUrl: process.env.API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:4000/api/v1",
  webBaseUrl: process.env.WEB_BASE_URL?.replace(/\/+$/, "") || "http://localhost:3000",
  defaultLat: Number(process.env.DEFAULT_LAT ?? "9.032"),
  defaultLng: Number(process.env.DEFAULT_LNG ?? "38.748"),
  productsPerPage: 5,
  maxCategoriesShown: 12,
};
