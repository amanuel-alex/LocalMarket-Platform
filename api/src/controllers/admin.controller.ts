import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { orderIdParamSchema } from "../schemas/order.schemas.js";
import { logQuerySchema } from "../schemas/admin.schemas.js";
import * as analyticsService from "../services/analytics.service.js";
import * as logService from "../services/log.service.js";
import * as orderService from "../services/order.service.js";

/** Release platform escrow for an order (seller must have confirmed delivery). */
export const releaseOrderEscrow: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = orderIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const order = await orderService.releaseOrderEscrowByAdmin(parsed.data.id);
  res.json({ order });
});

export const getSystemAnalytics: RequestHandler = asyncHandler(async (_req, res) => {
  const analytics = await analyticsService.getSystemAnalytics();
  res.json({ analytics });
});

export const listRequestLogs: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = logQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const { limit, offset } = parsed.data;
  const result = await logService.listRequestLogs(limit, offset);
  res.json(result);
});

export const listErrorLogs: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = logQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const { limit, offset } = parsed.data;
  const result = await logService.listErrorLogs(limit, offset);
  res.json(result);
});
