import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { orderIdParamSchema } from "../schemas/order.schemas.js";
import { productIdParamSchema } from "../schemas/product.schemas.js";
import {
  adminAssignProductGroupBodySchema,
  adminBanBodySchema,
  adminCommissionBodySchema,
  adminCreateProductGroupBodySchema,
  adminOrderOverrideBodySchema,
  logQuerySchema,
  metricsWindowQuerySchema,
  userIdParamSchema,
} from "../schemas/admin.schemas.js";
import * as adminUsersService from "../services/adminUsers.service.js";
import * as analyticsService from "../services/analytics.service.js";
import * as auditService from "../services/audit.service.js";
import * as logService from "../services/log.service.js";
import * as orderService from "../services/order.service.js";
import * as platformSettingsService from "../services/platformSettings.service.js";
import * as productService from "../services/product.service.js";
import * as metricsService from "../services/metrics.service.js";

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

/** Rolling HTTP observability from persisted request logs (latency + error rates). */
export const getObservabilityMetrics: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = metricsWindowQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const metrics = await metricsService.getHttpMetricsSummary(parsed.data.windowHours);
  res.json({ metrics });
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

export const getSettings: RequestHandler = asyncHandler(async (_req, res) => {
  const settings = await platformSettingsService.getPlatformSettings();
  res.json({
    settings: {
      commissionRateBps: settings.commissionRateBps,
      updatedAt: settings.updatedAt,
    },
  });
});

export const patchCommission: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = adminCommissionBodySchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const settings = await platformSettingsService.setCommissionRateBps(parsed.data.commissionRateBps);
  await auditService.recordAudit({
    actorId: req.user!.id,
    action: "settings.commission",
    targetType: "PlatformSettings",
    targetId: String(settings.id),
    meta: { commissionRateBps: settings.commissionRateBps },
  });
  res.json({ settings });
});

export const banUser: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsedParams = userIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    next(parsedParams.error);
    return;
  }
  const parsedBody = adminBanBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    next(parsedBody.error);
    return;
  }
  await adminUsersService.banUserByAdmin(req.user!.id, parsedParams.data.id, parsedBody.data.reason);
  res.status(204).send();
});

export const unbanUser: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsedParams = userIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    next(parsedParams.error);
    return;
  }
  await adminUsersService.unbanUserByAdmin(req.user!.id, parsedParams.data.id);
  res.status(204).send();
});

export const overrideOrder: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsedParams = orderIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    next(parsedParams.error);
    return;
  }
  const parsedBody = adminOrderOverrideBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    next(parsedBody.error);
    return;
  }
  const order = await orderService.adminOverrideOrder(req.user!.id, parsedParams.data.id, {
    status: parsedBody.data.status,
    clearPickupQr: parsedBody.data.clearPickupQr,
    adminNote: parsedBody.data.adminNote,
  });
  res.json({ order });
});

export const createProductGroup: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = adminCreateProductGroupBodySchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const group = await productService.createProductGroup(parsed.data.label);
  await auditService.recordAudit({
    actorId: req.user!.id,
    action: "product_group.create",
    targetType: "ProductGroup",
    targetId: group.id,
    meta: { label: group.label },
  });
  res.status(201).json({ group });
});

export const assignProductGroup: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsedParams = productIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    next(parsedParams.error);
    return;
  }
  const parsedBody = adminAssignProductGroupBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    next(parsedBody.error);
    return;
  }
  const product = await productService.adminAssignProductGroup(
    parsedParams.data.id,
    parsedBody.data.productGroupId,
  );
  await auditService.recordAudit({
    actorId: req.user!.id,
    action: "product.assign_group",
    targetType: "Product",
    targetId: parsedParams.data.id,
    meta: { productGroupId: parsedBody.data.productGroupId },
  });
  res.json({ product });
});
