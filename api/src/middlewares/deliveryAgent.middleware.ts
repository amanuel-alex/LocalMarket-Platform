import type { RequestHandler } from "express";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import { isDeliveryRole } from "../utils/roles.js";

export const requireApprovedDeliveryAgent: RequestHandler = async (req, _res, next) => {
  if (!req.user) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    return;
  }
  if (!isDeliveryRole(req.user.role)) {
    next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { deliveryAgentApproved: true, deliveryAgentActive: true },
  });
  if (!user?.deliveryAgentApproved) {
    next(new AppError(403, "DELIVERY_NOT_APPROVED", "Delivery account is not approved yet"));
    return;
  }
  if (!user.deliveryAgentActive) {
    next(new AppError(403, "DELIVERY_INACTIVE", "Delivery account is inactive"));
    return;
  }
  next();
};
