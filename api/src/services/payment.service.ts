import { randomBytes } from "node:crypto";
import type { OrderStatus, Payment, PaymentStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import type { InitiatePaymentInput, MpesaCallbackInput } from "../schemas/payment.schemas.js";
import * as dispatch from "./notificationDispatch.service.js";
import { getPreferredLocalesMap } from "../i18n/userLocales.js";
import {
  orderPaidSellerCopy,
  paymentSuccessBuyerCopy,
} from "../i18n/notificationCopy.js";
import * as walletService from "./wallet.service.js";
import { getPaymentQueue, isQueueInfrastructureEnabled } from "../queues/queueClient.js";

type MpesaCallbackTxResult = {
  payment: Payment;
  orderStatus: OrderStatus;
  pickupQrToken?: string;
  notifyDraft?: {
    buyerId: string;
    sellerId: string;
    productTitle: string;
    orderId: string;
  };
};

export type StkPushSimulatedResponse = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

export type InitiatePaymentResult = {
  stkPush: StkPushSimulatedResponse;
  payment: {
    id: string;
    orderId: string;
    amount: number;
    status: PaymentStatus;
    checkoutRequestId: string;
  };
};

function mockCheckoutIds(): { merchantRequestId: string; checkoutRequestId: string } {
  const suffix = randomBytes(6).toString("hex");
  return {
    merchantRequestId: `mock-mr-${suffix}`,
    checkoutRequestId: `ws_CO_${Date.now()}_${suffix}`,
  };
}

export async function initiateStkPush(
  buyerId: string,
  input: InitiatePaymentInput,
): Promise<InitiatePaymentResult> {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) {
    throw new AppError(404, "NOT_FOUND", "Order not found");
  }
  if (order.buyerId !== buyerId) {
    throw new AppError(403, "FORBIDDEN", "You can only pay for your own orders");
  }
  if (order.status !== "pending") {
    throw new AppError(409, "ORDER_NOT_PAYABLE", "Order is not pending payment");
  }

  const { merchantRequestId, checkoutRequestId } = mockCheckoutIds();

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: order.totalPrice,
      phone: input.phone ?? null,
      checkoutRequestId,
      merchantRequestId,
      status: "pending",
    },
  });

  if (isQueueInfrastructureEnabled()) {
    const q = getPaymentQueue();
    await q.add(
      "verify-one",
      { paymentId: payment.id },
      {
        delay: 90_000,
        attempts: 4,
        backoff: { type: "exponential", delay: 4000 },
        jobId: `verify-payment-${payment.id}`,
        removeOnComplete: { count: 500 },
      },
    );
  }

  const stkPush: StkPushSimulatedResponse = {
    MerchantRequestID: merchantRequestId,
    CheckoutRequestID: checkoutRequestId,
    ResponseCode: "0",
    ResponseDescription: "Success. Request accepted for processing (mock STK)",
    CustomerMessage: "Success. Request accepted for processing",
  };

  return {
    stkPush,
    payment: {
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount.toNumber(),
      status: payment.status,
      checkoutRequestId: payment.checkoutRequestId,
    },
  };
}

export async function processMpesaCallback(input: MpesaCallbackInput): Promise<{
  payment: Payment;
  orderStatus: OrderStatus;
  /** Issued when this callback first transitions the order from pending → paid (for mock/E2E). */
  pickupQrToken?: string;
}> {
  const success = input.ResultCode === 0;

  const result = await prisma.$transaction(async (tx): Promise<MpesaCallbackTxResult> => {
    const payment = await tx.payment.findUnique({
      where: { checkoutRequestId: input.CheckoutRequestID },
    });
    if (!payment) {
      throw new AppError(404, "NOT_FOUND", "Unknown CheckoutRequestID");
    }

    if (payment.status === "completed") {
      const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
      return { payment, orderStatus: order.status };
    }

    if (success) {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: "completed" },
      });
      let pickupQrToken: string | undefined;
      let notifyDraft: MpesaCallbackTxResult["notifyDraft"];
      const orderBefore = await tx.order.findUnique({
        where: { id: payment.orderId },
        include: { product: { select: { title: true } } },
      });
      if (orderBefore?.status === "pending") {
        const qrToken = randomBytes(32).toString("base64url");
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "paid", qrToken },
        });
        pickupQrToken = qrToken;

        await walletService.applyEscrowFromPayment(tx, {
          orderId: payment.orderId,
          paymentId: payment.id,
          sellerId: orderBefore.sellerId,
          amount: orderBefore.totalPrice,
        });

        notifyDraft = {
          buyerId: orderBefore.buyerId,
          sellerId: orderBefore.sellerId,
          productTitle: orderBefore.product.title,
          orderId: orderBefore.id,
        };
      }
      const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
      return { payment: updatedPayment, orderStatus: order.status, pickupQrToken, notifyDraft };
    }

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
    return {
      payment: updatedPayment,
      orderStatus: order.status,
    };
  });

  if (result.notifyDraft) {
    const d = result.notifyDraft;
    const locs = await getPreferredLocalesMap([d.buyerId, d.sellerId]);
    const buyerL = locs.get(d.buyerId) ?? "en";
    const sellerL = locs.get(d.sellerId) ?? "en";
    const buyerCopy = paymentSuccessBuyerCopy(buyerL, d.productTitle);
    const sellerCopy = orderPaidSellerCopy(sellerL, d.productTitle);
    await dispatch.dispatchNotifications([
      {
        userId: d.buyerId,
        type: "payment_success",
        title: buyerCopy.title,
        body: buyerCopy.body,
        orderId: d.orderId,
      },
      {
        userId: d.sellerId,
        type: "order_update",
        title: sellerCopy.title,
        body: sellerCopy.body,
        orderId: d.orderId,
      },
    ]);
  }

  return {
    payment: result.payment,
    orderStatus: result.orderStatus,
    pickupQrToken: result.pickupQrToken,
  };
}
