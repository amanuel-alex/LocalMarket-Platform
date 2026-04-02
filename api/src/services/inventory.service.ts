import type { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors.js";

/**
 * Atomically reserves units for a new pending order. Fails if concurrent checkouts exhaust stock.
 */
export async function reserveStockForOrder(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
): Promise<void> {
  const result = await tx.product.updateMany({
    where: { id: productId, stockQuantity: { gte: quantity } },
    data: { stockQuantity: { decrement: quantity } },
  });
  if (result.count === 0) {
    throw new AppError(409, "OUT_OF_STOCK", "Not enough stock available for this quantity");
  }
}

export async function releaseReservedStockForOrder(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
): Promise<void> {
  await tx.product.update({
    where: { id: productId },
    data: { stockQuantity: { increment: quantity } },
  });
}
