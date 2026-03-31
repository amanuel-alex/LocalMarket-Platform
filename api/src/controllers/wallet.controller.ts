import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { transactionsQuerySchema } from "../schemas/wallet.schemas.js";
import * as walletService from "../services/wallet.service.js";

export const me: RequestHandler = asyncHandler(async (req, res) => {
  const wallet = await walletService.getWalletBalanceForUser(req.user!.id);
  res.json({ wallet });
});

export const transactions: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = transactionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const items = await walletService.listTransactionsForUser(req.user!.id, parsed.data.limit);
  res.json({ transactions: items });
});
