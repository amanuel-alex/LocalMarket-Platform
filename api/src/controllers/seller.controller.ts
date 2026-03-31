import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sellerShopLocationSchema } from "../schemas/location.schemas.js";
import * as sellerService from "../services/seller.service.js";

export const updateShopLocation: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = sellerShopLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const seller = await sellerService.updateSellerShopLocation(req.user!.id, parsed.data);
  res.json({ seller });
});
