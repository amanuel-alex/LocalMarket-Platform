import type { Role } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import type { OrderJson } from "./order.service.js";
import { toOrderJson } from "./order.service.js";
import { isDeliveryRole } from "../utils/roles.js";
import * as dispatch from "./notificationDispatch.service.js";
import { getPreferredLocalesMap } from "../i18n/userLocales.js";
import { pickupCompletedBuyerCopy } from "../i18n/notificationCopy.js";

/** pickup verified → order `completed`. Funds stay in platform escrow until seller confirms delivery and admin releases. */
export async function verifyPickupQr(userId: string, role: Role, token: string): Promise<OrderJson> {
  if (isDeliveryRole(role)) {
    const agent = await prisma.user.findUnique({
      where: { id: userId },
      select: { deliveryAgentApproved: true, deliveryAgentActive: true },
    });
    if (!agent?.deliveryAgentApproved || !agent.deliveryAgentActive) {
      throw new AppError(403, "DELIVERY_NOT_APPROVED", "Delivery account is not approved or active");
    }
  }

  const order = await prisma.order.findUnique({
    where: { qrToken: token },
    include: { product: { select: { id: true, title: true, price: true } } },
  });

  if (!order) {
    throw new AppError(404, "NOT_FOUND", "Invalid or unknown pickup code");
  }

  if (role === "seller") {
    if (order.sellerId !== userId) {
      throw new AppError(403, "FORBIDDEN", "This order belongs to another seller");
    }
  } else if (isDeliveryRole(role)) {
    if (order.deliveryAgentId !== userId) {
      throw new AppError(403, "FORBIDDEN", "You are not assigned to this order");
    }
  } else {
    throw new AppError(403, "FORBIDDEN", "Insufficient permissions");
  }

  if (order.qrConsumedAt) {
    throw new AppError(409, "QR_ALREADY_USED", "This pickup code has already been used");
  }

  if (order.status !== "paid") {
    throw new AppError(409, "ORDER_NOT_READY", "Order cannot be picked up in its current state");
  }

  const updated = await prisma.$transaction(async (tx) => {
    return tx.order.update({
      where: { id: order.id },
      data: {
        status: "completed",
        qrConsumedAt: new Date(),
      },
      include: { product: { select: { id: true, title: true, price: true } } },
    });
  });

  const locs = await getPreferredLocalesMap([updated.buyerId]);
  const buyerL = locs.get(updated.buyerId) ?? "en";
  const copy = pickupCompletedBuyerCopy(buyerL, updated.product.title);
  await dispatch.dispatchNotifications([
    {
      userId: updated.buyerId,
      type: "order_update",
      title: copy.title,
      body: copy.body,
      orderId: updated.id,
    },
  ]);

  return toOrderJson(updated, { userId, role });
}
