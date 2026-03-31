import { Queue } from "bullmq";
import { getEnv } from "../config/env.js";

export const QUEUE_PREFIX = "localmarket";

/** Redis URL present (BullMQ + optional ioredis cache share this). */
export function isQueueInfrastructureEnabled(): boolean {
  return Boolean(getEnv().REDIS_URL?.trim());
}

function connectionOpts() {
  return { url: getEnv().REDIS_URL.trim() };
}

let notificationQueue: Queue | null = null;
let paymentQueue: Queue | null = null;
let cleanupQueue: Queue | null = null;

export function getNotificationQueue(): Queue {
  if (!notificationQueue) {
    notificationQueue = new Queue("notifications", {
      connection: connectionOpts(),
      prefix: QUEUE_PREFIX,
    });
  }
  return notificationQueue;
}

export function getPaymentQueue(): Queue {
  if (!paymentQueue) {
    paymentQueue = new Queue("payments", { connection: connectionOpts(), prefix: QUEUE_PREFIX });
  }
  return paymentQueue;
}

export function getCleanupQueue(): Queue {
  if (!cleanupQueue) {
    cleanupQueue = new Queue("cleanup", { connection: connectionOpts(), prefix: QUEUE_PREFIX });
  }
  return cleanupQueue;
}

export async function closeQueues(): Promise<void> {
  await Promise.all(
    [notificationQueue, paymentQueue, cleanupQueue].filter(Boolean).map((q) => q!.close()),
  );
  notificationQueue = null;
  paymentQueue = null;
  cleanupQueue = null;
}
