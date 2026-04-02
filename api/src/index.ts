import "dotenv/config";
import { getEnv } from "./config/env.js";
import { app } from "./app.js";
import { startWorkers, stopWorkers } from "./queues/workers.js";

const env = getEnv();
const { PORT } = env;

const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  const geminiOn = Boolean((env.GOOGLE_AI_API_KEY || env.GEMINI_API_KEY || "").trim());
  console.log(
    geminiOn
      ? "Assistant: Google Gemini enabled (API key set on this server)."
      : "Assistant: rules-only — set GOOGLE_AI_API_KEY or GEMINI_API_KEY in api/.env and restart for Gemini.",
  );
  void startWorkers();
});

async function shutdown(): Promise<void> {
  await stopWorkers();
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

process.once("SIGTERM", () => {
  void shutdown().then(() => process.exit(0));
});
process.once("SIGINT", () => {
  void shutdown().then(() => process.exit(0));
});
