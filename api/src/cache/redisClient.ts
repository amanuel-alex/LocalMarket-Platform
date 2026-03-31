import { Redis } from "ioredis";
import { getEnv } from "../config/env.js";

let singleton: Redis | undefined;

export function getRedis(): Redis | null {
  const url = getEnv().REDIS_URL?.trim();
  if (!url) {
    return null;
  }

  if (!singleton) {
    singleton = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    singleton.on("error", (err: Error) => {
      console.error("[redis]", err.message);
    });
  }

  return singleton;
}

/** For tests: drop singleton so the next getRedis() re-reads env. */
export function resetRedisClientForTests(): void {
  if (singleton) {
    void singleton.quit().catch(() => {});
  }
  singleton = undefined;
}
