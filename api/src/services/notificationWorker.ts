import { prisma } from "../prisma/client.js";
import type { NotificationPayload } from "./notificationDispatch.service.js";

/** Used by the BullMQ worker (same persistence as synchronous fallback). */
export async function persistNotificationsPayloads(items: NotificationPayload[]): Promise<void> {
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
