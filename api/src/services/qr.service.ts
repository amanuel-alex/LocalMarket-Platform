import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import type { OrderJson } from "./order.service.js";
import { toOrderJson } from "./order.service.js";
import * as walletService from "./wallet.service.js";

export async function verifyPickupQr(sellerId: string, token: string): Promise<OrderJson> {
  const order = await prisma.order.findUnique({
    where: { qrToken: token },
    include: { product: { select: { id: true, title: true, price: true } } },
  });

  if (!order) {
    throw new AppError(404, "NOT_FOUND", "Invalid or unknown pickup code");
  }

  if (order.sellerId !== sellerId) {
    throw new AppError(403, "FORBIDDEN", "This order belongs to another seller");
  }

  if (order.qrConsumedAt) {
    throw new AppError(409, "QR_ALREADY_USED", "This pickup code has already been used");
  }

  if (order.status !== "paid") {
    throw new AppError(409, "ORDER_NOT_READY", "Order cannot be picked up in its current state");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "completed",
        qrConsumedAt: new Date(),
      },
      include: { product: { select: { id: true, title: true, price: true } } },
    });

    await walletService.releaseEscrowForOrder(tx, {
      orderId: order.id,
      sellerId: order.sellerId,
      amount: order.totalPrice,
    });

    return row;
  });

  return toOrderJson(updated, { userId: sellerId, role: "seller" });
}
