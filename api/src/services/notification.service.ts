import type { Notification, NotificationType } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";

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
