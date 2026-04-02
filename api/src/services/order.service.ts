import type {
  DeliveryStatus,
  Order,
  OrderStatus,
  Prisma,
  Product,
  Role,
} from "@prisma/client";
import { prisma } from "../prisma/client.js";
import * as orderRepo from "../repositories/order.repository.js";
import * as productRepo from "../repositories/product.repository.js";
import { AppError } from "../utils/errors.js";
import type { CreateOrderInput } from "../schemas/order.schemas.js";
import { isDeliveryRole } from "../utils/roles.js";
import * as auditService from "./audit.service.js";
import * as dispatch from "./notificationDispatch.service.js";
import { getPreferredLocalesMap } from "../i18n/userLocales.js";
import {
  deliveryConfirmedBuyerCopy,
  newOrderSellerCopy,
} from "../i18n/notificationCopy.js";
import * as walletService from "./wallet.service.js";
import * as inventoryService from "./inventory.service.js";
import { bumpProductCatalogCacheEpoch } from "../cache/productCatalog.cache.js";

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
  deliveryAgentId: string | null;
  deliveryStartedAt: Date | null;
  deliveryStatus: DeliveryStatus;
  readyForPickupAt: Date | null;
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
    deliveryAgentId: row.deliveryAgentId ?? null,
    deliveryStartedAt: row.deliveryStartedAt ?? null,
    deliveryStatus: row.deliveryStatus,
    readyForPickupAt: row.readyForPickupAt ?? null,
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
  const product = await productRepo.findProductForNewOrder(input.productId);
  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  const totalPrice = product.price.times(input.quantity);

  const row = await prisma.$transaction(async (tx) => {
    await inventoryService.allocateSoldForOrder(tx, product.id, input.quantity);
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

  await bumpProductCatalogCacheEpoch();

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

export async function cancelPendingOrderByBuyer(buyerId: string, orderId: string): Promise<OrderJson> {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { select: productSelect } },
  });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Order not found");
  }
  if (row.buyerId !== buyerId) {
    throw new AppError(403, "FORBIDDEN", "You can only cancel your own orders");
  }
  if (row.status !== "pending") {
    throw new AppError(409, "ORDER_NOT_READY", "Only unpaid pending orders can be cancelled");
  }
  const paid = await prisma.payment.count({
    where: { orderId, status: "completed" },
  });
  if (paid > 0) {
    throw new AppError(409, "ORDER_NOT_PAYABLE", "Cannot cancel an order with a completed payment");
  }
  const paymentInFlight = await prisma.payment.count({
    where: { orderId, status: "pending" },
  });
  if (paymentInFlight > 0) {
    throw new AppError(
      409,
      "PAYMENT_IN_PROGRESS",
      "Finish or wait for payment to finish before cancelling this order",
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await inventoryService.releaseSoldForCancelledOrder(tx, row.productId, row.quantity);
    return tx.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
      include: { product: { select: productSelect } },
    });
  });

  await bumpProductCatalogCacheEpoch();

  return toOrderJson(updated, { userId: buyerId, role: "buyer" });
}

export async function listOrdersForUser(userId: string, role: Role): Promise<OrderJson[]> {
  const where =
    role === "admin"
      ? {}
      : role === "seller"
        ? { sellerId: userId }
        : isDeliveryRole(role)
          ? { deliveryAgentId: userId }
          : { buyerId: userId };

  const rows = await orderRepo.findOrdersWithProductForList(where);

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
    role === "admin" ||
    row.buyerId === userId ||
    row.sellerId === userId ||
    (isDeliveryRole(role) && row.deliveryAgentId === userId);
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

export async function sellerAssignDeliveryAgent(
  sellerId: string,
  orderId: string,
  deliveryAgentId: string,
): Promise<OrderJson> {
  const agent = await prisma.user.findUnique({ where: { id: deliveryAgentId } });
  if (!agent || !isDeliveryRole(agent.role)) {
    throw new AppError(400, "INVALID_AGENT", "Not a valid delivery agent");
  }
  if (!agent.deliveryAgentApproved || !agent.deliveryAgentActive) {
    throw new AppError(
      400,
      "AGENT_NOT_AVAILABLE",
      "Delivery agent must be approved and active",
    );
  }

  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { select: productSelect } },
  });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Order not found");
  }
  if (row.sellerId !== sellerId) {
    throw new AppError(403, "FORBIDDEN", "You can only assign delivery on your own orders");
  }
  if (row.status !== "paid") {
    throw new AppError(
      409,
      "ORDER_NOT_READY",
      "Assign delivery only after the buyer has paid",
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryAgent: { connect: { id: deliveryAgentId } },
      deliveryStatus: "assigned",
      deliveryStartedAt: null,
    },
    include: { product: { select: productSelect } },
  });

  return toOrderJson(updated, { userId: sellerId, role: "seller" });
}

export async function sellerMarkOrderReadyForPickup(
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
    throw new AppError(403, "FORBIDDEN", "You can only mark your own orders ready");
  }
  if (row.status !== "paid") {
    throw new AppError(409, "ORDER_NOT_READY", "Order must be paid before marking ready for pickup");
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { readyForPickupAt: new Date() },
    include: { product: { select: productSelect } },
  });

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
    deliveryAgentId?: string | null;
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
  if (input.deliveryAgentId !== undefined) {
    if (input.deliveryAgentId === null) {
      data.deliveryAgent = { disconnect: true };
      data.deliveryStatus = "pending";
    } else {
      data.deliveryAgent = { connect: { id: input.deliveryAgentId } };
      data.deliveryStatus = "assigned";
    }
    data.deliveryStartedAt = null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (input.status === "cancelled" && row.status === "pending") {
      await inventoryService.releaseSoldForCancelledOrder(tx, row.productId, row.quantity);
    }
    return tx.order.update({
      where: { id: orderId },
      data,
      include: { product: { select: productSelect } },
    });
  });

  if (input.status === "cancelled" && row.status === "pending") {
    await bumpProductCatalogCacheEpoch();
  }

  await auditService.recordAudit({
    actorId: adminId,
    action: "order.override",
    targetType: "Order",
    targetId: orderId,
    note: input.adminNote ?? null,
    meta: {
      status: input.status ?? null,
      clearPickupQr: input.clearPickupQr ?? false,
      deliveryAgentId: input.deliveryAgentId ?? undefined,
    },
  });

  return toOrderJson(updated, { userId: adminId, role: "admin" });
}
