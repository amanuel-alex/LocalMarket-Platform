import "dotenv/config";
import { getEnv } from "./config/env.js";
import { app } from "./app.js";
import { startWorkers, stopWorkers } from "./queues/workers.js";

const { PORT } = getEnv();

const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
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
