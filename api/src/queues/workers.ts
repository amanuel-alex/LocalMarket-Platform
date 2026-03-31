import { Worker } from "bullmq";
import { getEnv } from "../config/env.js";
import * as cleanupService from "../services/cleanup.service.js";
import type { NotificationPayload } from "../services/notificationDispatch.service.js";
import { persistNotificationsPayloads } from "../services/notificationWorker.js";
import * as paymentVerificationService from "../services/paymentVerification.service.js";
import {
  closeQueues,
  getCleanupQueue,
  getPaymentQueue,
  isQueueInfrastructureEnabled,
  QUEUE_PREFIX,
} from "./queueClient.js";

const workers: Worker[] = [];

function connectionOpts() {
  return { url: getEnv().REDIS_URL.trim() };
}

export async function startWorkers(): Promise<void> {
  if (!isQueueInfrastructureEnabled()) {
    console.info("[queues] Redis URL not set — background workers disabled");
    return;
  }

  workers.push(
    new Worker(
      "notifications",
      async (job) => {
        if (job.name === "deliver") {
          const { items } = job.data as { items: NotificationPayload[] };
          await persistNotificationsPayloads(items);
        }
      },
      { connection: connectionOpts(), prefix: QUEUE_PREFIX, concurrency: 5 },
    ),
  );

  workers.push(
    new Worker(
      "payments",
      async (job) => {
        if (job.name === "verify-one") {
          const { paymentId } = job.data as { paymentId: string };
          await paymentVerificationService.verifySinglePendingPayment(paymentId);
        }
        if (job.name === "sweep-stale") {
          await paymentVerificationService.sweepStalePendingPayments();
        }
      },
      { connection: connectionOpts(), prefix: QUEUE_PREFIX, concurrency: 2 },
    ),
  );

  workers.push(
    new Worker(
      "cleanup",
      async (job) => {
        if (job.name === "purge-logs") {
          const result = await cleanupService.runLogCleanup();
          console.info("[cleanup] removed logs:", result);
        }
      },
      { connection: connectionOpts(), prefix: QUEUE_PREFIX, concurrency: 1 },
    ),
  );

  const paymentQ = getPaymentQueue();
  await paymentQ.add(
    "sweep-stale",
    {},
    {
      repeat: { every: 5 * 60 * 1000 },
      jobId: "cron-payment-sweep",
    },
  );

  const cleanupQ = getCleanupQueue();
  await cleanupQ.add(
    "purge-logs",
    {},
    {
      repeat: { every: 24 * 60 * 60 * 1000 },
      jobId: "cron-log-cleanup",
    },
  );

  console.info("[queues] BullMQ workers + repeatable jobs started");
}

export async function stopWorkers(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
  workers.length = 0;
  await closeQueues();
}
