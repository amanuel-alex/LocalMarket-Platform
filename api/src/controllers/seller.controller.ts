import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sellerShopLocationSchema } from "../schemas/location.schemas.js";
import { sellerInsightsQuerySchema } from "../schemas/seller.schemas.js";
import * as sellerService from "../services/seller.service.js";
import * as sellerInsightsService from "../services/sellerInsights.service.js";

export const updateShopLocation: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = sellerShopLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const seller = await sellerService.updateSellerShopLocation(req.user!.id, parsed.data);
  res.json({ seller });
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
