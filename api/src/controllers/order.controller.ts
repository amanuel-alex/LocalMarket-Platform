import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  assignDeliveryBodySchema,
  createOrderSchema,
  orderIdParamSchema,
} from "../schemas/order.schemas.js";
import { submitOrderReviewBodySchema } from "../schemas/review.schemas.js";
import * as orderService from "../services/order.service.js";
import * as receiptService from "../services/receipt.service.js";
import * as reviewService from "../services/review.service.js";

export const create: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const buyerId = req.user!.id;
  const order = await orderService.createOrder(buyerId, parsed.data);
  res.status(201).json({ order });
});

export const cancelPending: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = orderIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const order = await orderService.cancelPendingOrderByBuyer(req.user!.id, parsed.data.id);
  res.json({ order });
});

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const orders = await orderService.listOrdersForUser(req.user!.id, req.user!.role);
  res.json({ orders });
});

export const submitReview: RequestHandler = asyncHandler(async (req, res, next) => {
  const params = orderIdParamSchema.safeParse(req.params);
  if (!params.success) {
    next(params.error);
    return;
  }
  const body = submitOrderReviewBodySchema.safeParse(req.body);
  if (!body.success) {
    next(body.error);
    return;
  }
  const review = await reviewService.createOrderReview({
    buyerId: req.user!.id,
    orderId: params.data.id,
    stars: body.data.stars,
    comment: body.data.comment,
  });
  res.status(201).json({ review });
});

export const receipt: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = orderIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const receiptJson = await receiptService.buildOrderReceipt(
    parsed.data.id,
    req.user!.id,
    req.user!.role,
  );
  res.json({ receipt: receiptJson });
});

export const getById: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = orderIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const order = await orderService.getOrderByIdForUser(
    parsed.data.id,
    req.user!.id,
    req.user!.role,
  );
  res.json({ order });
});

export const confirmDelivery: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = orderIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const order = await orderService.confirmDeliveryBySeller(req.user!.id, parsed.data.id);
  res.json({ order });
});

export const assignDelivery: RequestHandler = asyncHandler(async (req, res, next) => {
  const params = orderIdParamSchema.safeParse(req.params);
  if (!params.success) {
    next(params.error);
    return;
  }
  const body = assignDeliveryBodySchema.safeParse(req.body);
  if (!body.success) {
    next(body.error);
    return;
  }
  const order = await orderService.sellerAssignDeliveryAgent(
    req.user!.id,
    params.data.id,
    body.data.deliveryAgentId,
  );
  res.json({ order });
});

export const markReadyForPickup: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = orderIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const order = await orderService.sellerMarkOrderReadyForPickup(req.user!.id, parsed.data.id);
  res.json({ order });
});
