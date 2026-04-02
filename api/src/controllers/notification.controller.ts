import type { RequestHandler } from "express";
import { notificationIdParamSchema } from "../schemas/notification.schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as notificationService from "../services/notification.service.js";

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listForUser(req.user!.id);
  res.json({ notifications });
});

export const unreadCount: RequestHandler = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.countUnreadForUser(req.user!.id);
  res.json({ unreadCount });
});

export const markRead: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = notificationIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const notification = await notificationService.markReadForUser(req.user!.id, parsed.data.id);
  res.json({ notification });
});
