import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";

export type DbTx = Prisma.TransactionClient;

export async function ensurePlatformWallet(tx: DbTx) {
  let w = await tx.wallet.findFirst({ where: { isPlatform: true } });
  if (!w) {
    w = await tx.wallet.create({
      data: {
        isPlatform: true,
        userId: null,
        availableBalance: 0,
        pendingBalance: 0,
      },
    });
  }
  return w;
}

export async function ensureUserWallet(tx: DbTx, userId: string) {
  let w = await tx.wallet.findUnique({ where: { userId } });
  if (!w) {
    w = await tx.wallet.create({
      data: {
        userId,
        isPlatform: false,
        availableBalance: 0,
        pendingBalance: 0,
      },
    });
  }
  return w;
}

/** On successful payment: funds sit in platform `available`; seller sees same amount in `pending` until pickup. */
export async function applyEscrowFromPayment(
  tx: DbTx,
  args: { orderId: string; paymentId: string; sellerId: string; amount: Prisma.Decimal },
): Promise<void> {
  const dup = await tx.walletTransaction.findFirst({
    where: { orderId: args.orderId, type: "order_escrow_in" },
  });
  if (dup) return;

  const platform = await ensurePlatformWallet(tx);
  const sellerWallet = await ensureUserWallet(tx, args.sellerId);

  await tx.wallet.update({
    where: { id: platform.id },
    data: { availableBalance: { increment: args.amount } },
  });
  await tx.wallet.update({
    where: { id: sellerWallet.id },
    data: { pendingBalance: { increment: args.amount } },
  });

  await tx.walletTransaction.createMany({
    data: [
      {
        walletId: platform.id,
        type: "order_escrow_in",
        amount: args.amount,
        orderId: args.orderId,
        paymentId: args.paymentId,
        note: "Settlement held by platform; seller credited as pending",
      },
      {
        walletId: sellerWallet.id,
        type: "order_escrow_in",
        amount: args.amount,
        orderId: args.orderId,
        paymentId: args.paymentId,
        note: "Seller pending until order completed (pickup / dispute window)",
      },
    ],
  });
}

/** After pickup verification: release escrow to seller available balance. */
export async function releaseEscrowForOrder(
  tx: DbTx,
  args: { orderId: string; sellerId: string; amount: Prisma.Decimal },
): Promise<void> {
  const dup = await tx.walletTransaction.findFirst({
    where: { orderId: args.orderId, type: "order_escrow_release" },
  });
  if (dup) return;

  const platform = await ensurePlatformWallet(tx);
  const sellerWallet = await ensureUserWallet(tx, args.sellerId);

  const sw = await tx.wallet.findUnique({ where: { id: sellerWallet.id } });
  if (!sw || sw.pendingBalance.lessThan(args.amount)) {
    throw new AppError(409, "WALLET_INCONSISTENT", "Seller escrow balance mismatch");
  }

  const p = await tx.wallet.findUnique({ where: { id: platform.id } });
  if (!p || p.availableBalance.lessThan(args.amount)) {
    throw new AppError(409, "WALLET_INCONSISTENT", "Escrow release failed: platform balance");
  }

  await tx.wallet.update({
    where: { id: platform.id },
    data: { availableBalance: { decrement: args.amount } },
  });
  await tx.wallet.update({
    where: { id: sellerWallet.id },
    data: {
      pendingBalance: { decrement: args.amount },
      availableBalance: { increment: args.amount },
    },
  });

  await tx.walletTransaction.createMany({
    data: [
      {
        walletId: platform.id,
        type: "order_escrow_release",
        amount: args.amount,
        orderId: args.orderId,
        note: "Escrow released after order completion",
      },
      {
        walletId: sellerWallet.id,
        type: "order_escrow_release",
        amount: args.amount,
        orderId: args.orderId,
        note: "Pending moved to available for payout",
      },
    ],
  });
}

export type WalletBalanceJson = {
  walletId: string;
  availableBalance: number;
  pendingBalance: number;
  isPlatform: boolean;
};

export async function getWalletBalanceForUser(userId: string): Promise<WalletBalanceJson> {
  const w = await prisma.wallet.findUnique({
    where: { userId },
  });
  if (!w) {
    const created = await prisma.wallet.create({
      data: { userId, availableBalance: 0, pendingBalance: 0 },
    });
    return {
      walletId: created.id,
      availableBalance: created.availableBalance.toNumber(),
      pendingBalance: created.pendingBalance.toNumber(),
      isPlatform: false,
    };
  }
  return {
    walletId: w.id,
    availableBalance: w.availableBalance.toNumber(),
    pendingBalance: w.pendingBalance.toNumber(),
    isPlatform: w.isPlatform,
  };
}

export async function listTransactionsForUser(
  userId: string,
  limit: number,
): Promise<
  Array<{
    id: string;
    type: string;
    amount: number;
    orderId: string | null;
    paymentId: string | null;
    payoutId: string | null;
    note: string | null;
    createdAt: Date;
  }>
> {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return [];

  const rows = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((r: (typeof rows)[number]) => ({
    id: r.id,
    type: r.type,
    amount: r.amount.toNumber(),
    orderId: r.orderId,
    paymentId: r.paymentId,
    payoutId: r.payoutId,
    note: r.note,
    createdAt: r.createdAt,
  }));
}
