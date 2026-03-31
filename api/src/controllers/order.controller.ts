import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createOrderSchema, orderIdParamSchema } from "../schemas/order.schemas.js";
import * as orderService from "../services/order.service.js";

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

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const orders = await orderService.listOrdersForUser(req.user!.id, req.user!.role);
  res.json({ orders });
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
