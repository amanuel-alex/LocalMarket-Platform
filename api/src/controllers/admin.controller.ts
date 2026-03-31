import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { orderIdParamSchema } from "../schemas/order.schemas.js";
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
