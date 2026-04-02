import type { RequestHandler } from "express";
import { orderIdParamSchema } from "../schemas/order.schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as deliveryService from "../services/delivery.service.js";

export const listAssignments: RequestHandler = asyncHandler(async (req, res) => {
  const agentId = req.user!.id;
  const assignments = await deliveryService.listAssignmentsForAgent(agentId);
  res.json({ assignments });
});

/** Alias for OpenAPI/clients expecting `/delivery/orders`. */
export const listOrders: RequestHandler = asyncHandler(async (req, res) => {
  const agentId = req.user!.id;
  const orders = await deliveryService.listAssignmentsForAgent(agentId);
  res.json({ orders });
});

export const getAssignment: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = orderIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const assignment = await deliveryService.getAssignmentForAgent(req.user!.id, parsed.data.id);
  res.json({ assignment });
});

export const startAssignment: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = orderIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const assignment = await deliveryService.startDeliveryAssignment(req.user!.id, parsed.data.id);
  res.json({ assignment });
});

export const pickupOrder: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = orderIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const order = await deliveryService.startDeliveryAssignment(req.user!.id, parsed.data.id);
  res.json({ order });
});

export const deliverOrder: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = orderIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const order = await deliveryService.markAssignmentDelivered(req.user!.id, parsed.data.id);
  res.json({ order });
});
