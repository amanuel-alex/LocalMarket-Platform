import type { Order, OrderStatus, Prisma, Product, Role } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import type { CreateOrderInput } from "../schemas/order.schemas.js";
import * as auditService from "./audit.service.js";
import * as dispatch from "./notificationDispatch.service.js";
import { getPreferredLocalesMap } from "../i18n/userLocales.js";
import {
  deliveryConfirmedBuyerCopy,
  newOrderSellerCopy,
} from "../i18n/notificationCopy.js";
import * as walletService from "./wallet.service.js";

type OrderWithProduct = Order & {
  product: Pick<Product, "id" | "title" | "price">;
};

export type OrderJson = {
  id: string;
  status: OrderStatus;
  quantity: number;
  totalPrice: number;
  buyerId: string;
  sellerId: string;
  productId: string;
  product: { id: string; title: string; price: number };
  createdAt: Date;
  updatedAt: Date;
  deliveryConfirmedAt: Date | null;
  escrowReleasedAt: Date | null;
  adminOverrideNote: string | null;
  adminOverriddenAt: Date | null;
  /** Completed + seller confirmed delivery + admin has not released escrow yet (awaiting admin/system). */
  eligibleForEscrowRelease: boolean;
  /** Present only for the buyer when order is paid and pickup QR is still unused. */
  pickupQrToken?: string;
};

export function toOrderJson(
  row: OrderWithProduct,
  viewer?: { userId: string; role: Role },
): OrderJson {
  const eligibleForEscrowRelease =
    row.status === "completed" &&
    row.deliveryConfirmedAt != null &&
    row.escrowReleasedAt == null;

  const base: OrderJson = {
    id: row.id,
    status: row.status,
    quantity: row.quantity,
    totalPrice: row.totalPrice.toNumber(),
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    productId: row.productId,
    product: {
      id: row.product.id,
      title: row.product.title,
      price: row.product.price.toNumber(),
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deliveryConfirmedAt: row.deliveryConfirmedAt ?? null,
    escrowReleasedAt: row.escrowReleasedAt ?? null,
    adminOverrideNote: row.adminOverrideNote ?? null,
    adminOverriddenAt: row.adminOverriddenAt ?? null,
    eligibleForEscrowRelease,
  };

  const showPickupToken =
    viewer &&
    viewer.role === "buyer" &&
    row.buyerId === viewer.userId &&
    row.status === "paid" &&
    row.qrConsumedAt === null &&
    row.qrToken !== null &&
    row.qrToken.length > 0;

  if (showPickupToken) {
    return { ...base, pickupQrToken: row.qrToken! };
  }

  return base;
}

const productSelect = { id: true, title: true, price: true } as const;

export async function createOrder(buyerId: string, input: CreateOrderInput): Promise<OrderJson> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, title: true, price: true, sellerId: true },
  });
  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  const totalPrice = product.price.times(input.quantity);

  const row = await prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        buyerId,
        sellerId: product.sellerId,
        productId: product.id,
        quantity: input.quantity,
        totalPrice,
        status: "pending",
      },
      include: { product: { select: productSelect } },
    });
  });

  const locs = await getPreferredLocalesMap([product.sellerId]);
  const sellerL = locs.get(product.sellerId) ?? "en";
  const copy = newOrderSellerCopy(sellerL, input.quantity, product.title);
  await dispatch.dispatchNotifications([
    {
      userId: product.sellerId,
      type: "order_update",
      title: copy.title,
      body: copy.body,
      orderId: row.id,
    },
  ]);

  return toOrderJson(row, { userId: buyerId, role: "buyer" });
}

export async function listOrdersForUser(userId: string, role: Role): Promise<OrderJson[]> {
  const where =
    role === "admin"
      ? {}
      : role === "seller"
        ? { sellerId: userId }
        : { buyerId: userId };

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { product: { select: productSelect } },
  });

  return rows.map((row) => toOrderJson(row, { userId, role }));
}

export async function getOrderByIdForUser(
  orderId: string,
  userId: string,
  role: Role,
): Promise<OrderJson> {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { select: productSelect } },
  });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Order not found");
  }
  const allowed =
    role === "admin" || row.buyerId === userId || row.sellerId === userId;
  if (!allowed) {
    throw new AppError(403, "FORBIDDEN", "You cannot access this order");
  }
  return toOrderJson(row, { userId, role });
}

/** After buyer pickup (QR): seller confirms delivery → funds become eligible for admin release. */
export async function confirmDeliveryBySeller(
  sellerId: string,
  orderId: string,
): Promise<OrderJson> {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { select: productSelect } },
  });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Order not found");
  }
  if (row.sellerId !== sellerId) {
    throw new AppError(403, "FORBIDDEN", "You can only confirm delivery on your own orders");
  }
  if (row.status !== "completed") {
    throw new AppError(409, "ORDER_NOT_READY", "Order must be completed (pickup verified) first");
  }
  if (row.deliveryConfirmedAt) {
    throw new AppError(409, "ALREADY_CONFIRMED", "Delivery was already confirmed");
  }
  if (row.escrowReleasedAt) {
    throw new AppError(409, "ALREADY_RELEASED", "Escrow was already released for this order");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { deliveryConfirmedAt: new Date() },
    include: { product: { select: productSelect } },
  });

  const locs = await getPreferredLocalesMap([updated.buyerId]);
  const buyerL = locs.get(updated.buyerId) ?? "en";
  const copy = deliveryConfirmedBuyerCopy(buyerL, updated.product.title);
  await dispatch.dispatchNotifications([
    {
      userId: updated.buyerId,
      type: "delivery_confirmation",
      title: copy.title,
      body: copy.body,
      orderId: updated.id,
    },
  ]);

  return toOrderJson(updated, { userId: sellerId, role: "seller" });
}

/** Admin/system: move escrow from pending → seller available after seller confirmed delivery. */
export async function releaseOrderEscrowByAdmin(orderId: string): Promise<OrderJson> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.order.findUnique({
      where: { id: orderId },
      include: { product: { select: productSelect } },
    });
    if (!row) {
      throw new AppError(404, "NOT_FOUND", "Order not found");
    }
    if (row.status !== "completed") {
      throw new AppError(409, "ORDER_NOT_READY", "Order must be completed before escrow release");
    }
    if (!row.deliveryConfirmedAt) {
      throw new AppError(409, "DELIVERY_NOT_CONFIRMED", "Seller has not confirmed delivery yet");
    }
    if (row.escrowReleasedAt) {
      throw new AppError(409, "ALREADY_RELEASED", "Escrow already released for this order");
    }

    await walletService.releaseEscrowForOrder(tx, {
      orderId: row.id,
      sellerId: row.sellerId,
      amount: row.totalPrice,
    });

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { escrowReleasedAt: new Date() },
      include: { product: { select: productSelect } },
    });

    return toOrderJson(updated, { userId: "", role: "admin" });
  });
}

/** Admin: adjust order fields (status, pickup token, note). Does not move wallet balances — use with care. */
export async function adminOverrideOrder(
  adminId: string,
  orderId: string,
  input: {
    status?: OrderStatus;
    clearPickupQr?: boolean;
    adminNote?: string;
  },
): Promise<OrderJson> {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { select: productSelect } },
  });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Order not found");
  }

  const data: Prisma.OrderUpdateInput = {
    adminOverriddenAt: new Date(),
  };
  if (input.adminNote !== undefined) {
    data.adminOverrideNote = input.adminNote;
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }
  if (input.clearPickupQr) {
    data.qrToken = null;
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data,
    include: { product: { select: productSelect } },
  });

  await auditService.recordAudit({
    actorId: adminId,
    action: "order.override",
    targetType: "Order",
    targetId: orderId,
    note: input.adminNote ?? null,
    meta: {
      status: input.status ?? null,
      clearPickupQr: input.clearPickupQr ?? false,
    },
  });

  return toOrderJson(updated, { userId: adminId, role: "admin" });
}
