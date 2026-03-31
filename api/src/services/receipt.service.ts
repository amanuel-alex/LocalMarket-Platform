import { createHash } from "node:crypto";
import type { Role } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import * as platformSettingsService from "./platformSettings.service.js";

export type OrderReceiptJson = {
  receiptNumber: string;
  issuedAt: string;
  order: {
    id: string;
    status: string;
    quantity: number;
    currency: string;
    total: number;
    createdAt: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  buyer: { id: string; name: string; phone: string };
  seller: { id: string; name: string; phone: string };
  payment: {
    id: string;
    status: string;
    amount: number;
    recordedAt: string;
  } | null;
  platform: {
    label: string;
    commissionRatePercent: number;
    feeAppliesOn: string;
  };
  viewerPerspective: "buyer" | "seller" | "admin";
  /** Present for seller/admin: estimated fee on gross (actual charge on escrow release). */
  sellerEconomics?: {
    gross: number;
    platformFee: number;
    netToSeller: number;
    escrowReleased: boolean;
  };
};

export async function buildOrderReceipt(
  orderId: string,
  viewerUserId: string,
  viewerRole: Role,
): Promise<OrderReceiptJson> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: { select: { id: true, name: true, phone: true } },
      seller: { select: { id: true, name: true, phone: true } },
      product: { select: { id: true, title: true, price: true } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    throw new AppError(404, "NOT_FOUND", "Order not found");
  }

  const allowed =
    viewerRole === "admin" || order.buyerId === viewerUserId || order.sellerId === viewerUserId;
  if (!allowed) {
    throw new AppError(403, "FORBIDDEN", "You cannot access this receipt");
  }

  if (order.status === "pending") {
    throw new AppError(409, "ORDER_NOT_PAYABLE", "Receipt is available after payment");
  }

  const settings = await platformSettingsService.getPlatformSettings();
  const bps = settings.commissionRateBps;
  const commissionPct = bps / 100;

  const unitPrice = order.product.price.toNumber();
  const gross = order.totalPrice.toNumber();
  const lineTotal = gross;

  const completedPayment = order.payments.find((p) => p.status === "completed");
  const paymentRow = completedPayment ?? order.payments[0] ?? null;

  const basis = `${order.id}:${paymentRow?.id ?? "nopay"}`;
  const receiptNumber = `R-${createHash("sha256").update(basis).digest("hex").slice(0, 12).toUpperCase()}`;

  const platformFeeDec = order.totalPrice.times(bps).dividedBy(10_000);
  const netDec = order.totalPrice.minus(platformFeeDec);
  const platformFee = Math.round(platformFeeDec.toNumber() * 100) / 100;
  const netToSeller = Math.round(netDec.toNumber() * 100) / 100;

  const viewerPerspective: OrderReceiptJson["viewerPerspective"] =
    viewerRole === "admin" ? "admin" : order.buyerId === viewerUserId ? "buyer" : "seller";

  const receipt: OrderReceiptJson = {
    receiptNumber,
    issuedAt: new Date().toISOString(),
    order: {
      id: order.id,
      status: order.status,
      quantity: order.quantity,
      currency: "ETB",
      total: gross,
      createdAt: order.createdAt.toISOString(),
    },
    lineItems: [
      {
        description: order.product.title,
        quantity: order.quantity,
        unitPrice,
        lineTotal,
      },
    ],
    buyer: order.buyer,
    seller: order.seller,
    payment: paymentRow
      ? {
          id: paymentRow.id,
          status: paymentRow.status,
          amount: paymentRow.amount.toNumber(),
          recordedAt: paymentRow.updatedAt.toISOString(),
        }
      : null,
    platform: {
      label: "LocalMarket Platform",
      commissionRatePercent: commissionPct,
      feeAppliesOn: "Seller payout (deducted when escrow is released after delivery).",
    },
    viewerPerspective,
  };

  if (viewerPerspective !== "buyer") {
    receipt.sellerEconomics = {
      gross,
      platformFee,
      netToSeller,
      escrowReleased: order.escrowReleasedAt != null,
    };
  }

  return receipt;
}
