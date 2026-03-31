import type { Notification, NotificationType } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import type { DbTx } from "./wallet.service.js";

export type NotificationJson = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  orderId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

function toJson(row: Notification): NotificationJson {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    orderId: row.orderId,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export async function createManyInTx(
  tx: DbTx,
  items: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    orderId?: string | null;
  }>,
): Promise<void> {
  if (items.length === 0) return;
  await tx.notification.createMany({
    data: items.map((i) => ({
      userId: i.userId,
      type: i.type,
      title: i.title,
      body: i.body,
      orderId: i.orderId ?? null,
    })),
  });
}

export async function listForUser(userId: string, limit = 100): Promise<NotificationJson[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toJson);
}

export async function markReadForUser(userId: string, notificationId: string): Promise<NotificationJson> {
  const row = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!row || row.userId !== userId) {
    throw new AppError(404, "NOT_FOUND", "Notification not found");
  }
  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
  return toJson(updated);
}
