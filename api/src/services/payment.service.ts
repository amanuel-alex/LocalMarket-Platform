import { randomBytes } from "node:crypto";
import type { OrderStatus, Payment, PaymentStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import type { InitiatePaymentInput, MpesaCallbackInput } from "../schemas/payment.schemas.js";

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

  return prisma.$transaction(async (tx) => {
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
      const orderBefore = await tx.order.findUnique({ where: { id: payment.orderId } });
      if (orderBefore?.status === "pending") {
        const qrToken = randomBytes(32).toString("base64url");
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: "paid", qrToken },
        });
        pickupQrToken = qrToken;
      }
      const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
      return { payment: updatedPayment, orderStatus: order.status, pickupQrToken };
    }

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } });
    return { payment: updatedPayment, orderStatus: order.status };
  });
}
