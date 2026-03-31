import type { NotificationType } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { getNotificationQueue, isQueueInfrastructureEnabled } from "../queues/queueClient.js";

export type NotificationPayload = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  orderId?: string | null;
};

async function persistNotifications(items: NotificationPayload[]): Promise<void> {
  if (items.length === 0) return;
  await prisma.notification.createMany({
    data: items.map((i) => ({
      userId: i.userId,
      type: i.type,
      title: i.title,
      body: i.body,
      orderId: i.orderId ?? null,
    })),
  });
}

/**
 * Enqueues to BullMQ when Redis is configured, otherwise writes immediately.
 * Keeps hot paths fast and retries transient Redis/DB issues when queued.
 */
export async function dispatchNotifications(items: NotificationPayload[]): Promise<void> {
  if (items.length === 0) return;
  if (isQueueInfrastructureEnabled()) {
    const q = getNotificationQueue();
    await q.add(
      "deliver",
      { items },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 2500 },
        removeOnComplete: { count: 2000 },
        removeOnFail: { count: 500 },
      },
    );
    return;
  }
  await persistNotifications(items);
}
