import { randomBytes } from "node:crypto";
import type { OrderStatus, Payment, PaymentStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import type { InitiatePaymentInput, MpesaCallbackInput } from "../schemas/payment.schemas.js";
import * as dispatch from "./notificationDispatch.service.js";
import type { NotificationPayload } from "./notificationDispatch.service.js";
import * as walletService from "./wallet.service.js";
import { getPaymentQueue, isQueueInfrastructureEnabled } from "../queues/queueClient.js";

type MpesaCallbackTxResult = {
  payment: Payment;
  orderStatus: OrderStatus;
  pickupQrToken?: string;
  notifyItems?: NotificationPayload[];
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
      let notifyItems: NotificationPayload[] | undefined;
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

        notifyItems = [
          {
            userId: orderBefore.buyerId,
            type: "payment_success",
            title: "Payment successful",
            body: `Your payment for "${orderBefore.product.title}" was received. Your order is paid and ready for pickup.`,
            orderId: orderBefore.id,
          },
          {
            userId: orderBefore.sellerId,
            type: "order_update",
            title: "Order paid",
            body: `The buyer paid for "${orderBefore.product.title}". Prepare for handoff.`,
            orderId: orderBefore.id,
          },
        ];
      }
      const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
      return { payment: updatedPayment, orderStatus: order.status, pickupQrToken, notifyItems };
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

  if (result.notifyItems?.length) {
    await dispatch.dispatchNotifications(result.notifyItems);
  }

  return {
    payment: result.payment,
    orderStatus: result.orderStatus,
    pickupQrToken: result.pickupQrToken,
  };
}
