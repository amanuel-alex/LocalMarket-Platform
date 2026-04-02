import type { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors.js";

const OUT_OF_STOCK_MSG = "Product is sold out or not enough stock";

/**
 * Atomically allocates `qty` to `sold` if `quantity - sold >= qty` (prevents overselling under concurrency).
 */
export async function allocateSoldForOrder(
  tx: Prisma.TransactionClient,
  productId: string,
  qty: number,
): Promise<void> {
  const n = await tx.$executeRaw`
    UPDATE "Product"
    SET
      "sold" = "sold" + ${qty},
      "isSoldOut" = ("sold" + ${qty}) >= "quantity"
    WHERE "id" = ${productId}
      AND ("quantity" - "sold") >= ${qty}
  `;
  if (Number(n) !== 1) {
    throw new AppError(409, "OUT_OF_STOCK", OUT_OF_STOCK_MSG);
  }
}

/** Restores allocation when a pending order is cancelled (buyer or admin). */
export async function releaseSoldForCancelledOrder(
  tx: Prisma.TransactionClient,
  productId: string,
  qty: number,
): Promise<void> {
  const n = await tx.$executeRaw`
    UPDATE "Product"
    SET
      "sold" = "sold" - ${qty},
      "isSoldOut" = ("sold" - ${qty}) >= "quantity"
    WHERE "id" = ${productId}
      AND "sold" >= ${qty}
  `;
  if (Number(n) !== 1) {
    throw new AppError(409, "INVENTORY_INVARIANT", "Could not restore product inventory for this order");
  }
}
