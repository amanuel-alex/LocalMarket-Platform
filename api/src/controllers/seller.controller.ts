import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { sellerShopLocationSchema } from "../schemas/location.schemas.js";
import { sellerIdParamSchema, sellerInsightsQuerySchema } from "../schemas/seller.schemas.js";
import * as sellerService from "../services/seller.service.js";
import * as sellerInsightsService from "../services/sellerInsights.service.js";
import * as trustService from "../services/trust.service.js";

export const updateShopLocation: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = sellerShopLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const seller = await sellerService.updateSellerShopLocation(req.user!.id, parsed.data);
  res.json({ seller });
});

/** Public trust score for a seller (for product cards / ranked listings). */
export const publicTrust: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = sellerIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const trust = await trustService.getPublicSellerTrust(parsed.data.sellerId);
  if (!trust) {
    next(new AppError(404, "NOT_FOUND", "Seller not found"));
    return;
  }
  res.json({ trust });
});

/** Sales summary + daily revenue series for dashboards (seller-only). */
export const insights: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = sellerInsightsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const insightsResult = await sellerInsightsService.getSellerInsights(
    req.user!.id,
    parsed.data.days,
  );
  res.json({ insights: insightsResult });
});
