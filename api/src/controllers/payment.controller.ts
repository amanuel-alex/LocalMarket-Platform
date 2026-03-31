import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { initiatePaymentSchema, mpesaCallbackSchema } from "../schemas/payment.schemas.js";
import * as paymentService from "../services/payment.service.js";

export const initiate: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = initiatePaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const result = await paymentService.initiateStkPush(req.user!.id, parsed.data);
  res.status(201).json(result);
});

/** Mock gateway → your server (no user JWT; optional shared secret). */
export const callback: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = mpesaCallbackSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const { payment, orderStatus, pickupQrToken } = await paymentService.processMpesaCallback(
    parsed.data,
  );
  res.status(200).json({
    ResultCode: "0",
    ResultDesc: "Callback processed",
    payment: {
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      checkoutRequestId: payment.checkoutRequestId,
    },
    orderStatus,
    ...(pickupQrToken ? { pickupQrToken } : {}),
  });
});
