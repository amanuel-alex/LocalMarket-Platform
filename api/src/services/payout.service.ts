import { Prisma } from "@prisma/client";
import type { Payout } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import * as walletService from "./wallet.service.js";

export async function requestPayout(userId: string, amount: number): Promise<Payout> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(400, "VALIDATION", "Invalid payout amount");
  }

  const amt = new Prisma.Decimal(amount);

  return prisma.$transaction(async (tx) => {
    const wallet = await walletService.ensureUserWallet(tx, userId);

    if (wallet.availableBalance.lessThan(amt)) {
      throw new AppError(409, "INSUFFICIENT_BALANCE", "Not enough available balance");
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { availableBalance: { decrement: amt } },
    });

    const payout = await tx.payout.create({
      data: { walletId: wallet.id, userId, amount: amt, status: "pending" },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "payout_reserve",
        amount: amt,
        payoutId: payout.id,
        note: "Reserved for payout request",
      },
    });

    return payout;
  });
}

export async function listPayoutsForUser(userId: string): Promise<Payout[]> {
  return prisma.payout.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" },
  });
}

export async function listAllPayoutsForAdmin(
  limit: number,
  offset: number,
): Promise<{
  payouts: Array<{
    id: string;
    userId: string;
    userName: string;
    userPhone: string;
    amount: number;
    status: string;
    requestedAt: string;
    completedAt: string | null;
    note: string | null;
  }>;
  total: number;
}> {
  const [rows, total] = await Promise.all([
    prisma.payout.findMany({
      orderBy: { requestedAt: "desc" },
      take: limit,
      skip: offset,
      include: { user: { select: { name: true, phone: true } } },
    }),
    prisma.payout.count(),
  ]);
  return {
    payouts: rows.map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name,
      userPhone: p.user.phone,
      amount: p.amount.toNumber(),
      status: p.status,
      requestedAt: p.requestedAt.toISOString(),
      completedAt: p.completedAt?.toISOString() ?? null,
      note: p.note,
    })),
    total,
  };
}

export async function adminMarkPayoutPaid(payoutId: string): Promise<Payout> {
  const p = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!p) throw new AppError(404, "NOT_FOUND", "Payout not found");
  if (p.status !== "pending") {
    throw new AppError(409, "INVALID_STATE", "Payout is not pending");
  }

  return prisma.$transaction(async (tx) => {
    await tx.payout.update({
      where: { id: payoutId },
      data: { status: "paid", completedAt: new Date() },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: p.walletId,
        type: "payout_complete",
        amount: p.amount,
        payoutId: p.id,
        note: "Payout marked paid (transfer off-platform)",
      },
    });
    return tx.payout.findUniqueOrThrow({ where: { id: payoutId } });
  });
}

export async function adminCancelPayout(payoutId: string): Promise<void> {
  const p = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!p) throw new AppError(404, "NOT_FOUND", "Payout not found");
  if (p.status !== "pending") {
    throw new AppError(409, "INVALID_STATE", "Payout is not pending");
  }

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: p.walletId },
      data: { availableBalance: { increment: p.amount } },
    });
    await tx.payout.update({
      where: { id: payoutId },
      data: {
        status: "cancelled",
        completedAt: new Date(),
        note: "Cancelled; funds returned to available balance",
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: p.walletId,
        type: "payout_cancel",
        amount: p.amount,
        payoutId: p.id,
        note: "Payout cancelled; balance restored",
      },
    });
  });
}
