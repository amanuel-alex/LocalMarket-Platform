import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { payoutIdParamSchema, payoutRequestSchema } from "../schemas/wallet.schemas.js";
import * as payoutService from "../services/payout.service.js";

function serializePayout(p: Awaited<ReturnType<typeof payoutService.listPayoutsForUser>>[0]) {
  return {
    id: p.id,
    walletId: p.walletId,
    userId: p.userId,
    amount: p.amount.toNumber(),
    status: p.status,
    note: p.note,
    requestedAt: p.requestedAt,
    completedAt: p.completedAt,
  };
}

export const requestPayout: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = payoutRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const row = await payoutService.requestPayout(req.user!.id, parsed.data.amount);
  res.status(201).json({ payout: serializePayout(row) });
});

export const listMine: RequestHandler = asyncHandler(async (req, res) => {
  const rows = await payoutService.listPayoutsForUser(req.user!.id);
  res.json({ payouts: rows.map(serializePayout) });
});

export const adminMarkPaid: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = payoutIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const row = await payoutService.adminMarkPayoutPaid(parsed.data.id);
  res.json({ payout: serializePayout(row) });
});

export const adminCancel: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = payoutIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  await payoutService.adminCancelPayout(parsed.data.id);
  res.status(204).send();
});
