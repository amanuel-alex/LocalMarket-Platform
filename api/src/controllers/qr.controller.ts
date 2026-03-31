import type { RequestHandler } from "express";
import { verifyQrSchema } from "../schemas/qr.schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as qrService from "../services/qr.service.js";

export const verify: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = verifyQrSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const order = await qrService.verifyPickupQr(req.user!.id, parsed.data.token);
  res.status(200).json({ order });
});
