import type { RequestHandler } from "express";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import { isDeliveryRole } from "../utils/roles.js";

/** Blocks seller catalog / shop APIs until an admin approves the seller account. */
export const requireApprovedSeller: RequestHandler = async (req, _res, next) => {
  if (!req.user) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    return;
  }
  if (req.user.role !== "seller") {
    next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
    return;
  }

  const row = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { sellerApproved: true },
  });
  if (!row?.sellerApproved) {
    next(new AppError(403, "SELLER_NOT_APPROVED", "Seller account is pending admin approval"));
    return;
  }
  next();
};

/** Pickup QR: approved seller, or approved active delivery agent. */
export const requireApprovedQrActor: RequestHandler = async (req, _res, next) => {
  if (!req.user) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    return;
  }
  const role = req.user.role;

  if (role === "seller") {
    const row = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { sellerApproved: true },
    });
    if (!row?.sellerApproved) {
      next(new AppError(403, "SELLER_NOT_APPROVED", "Seller account is pending admin approval"));
      return;
    }
    next();
    return;
  }

  if (isDeliveryRole(role)) {
    const row = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { deliveryAgentApproved: true, deliveryAgentActive: true },
    });
    if (!row?.deliveryAgentApproved) {
      next(new AppError(403, "DELIVERY_NOT_APPROVED", "Delivery account is not approved yet"));
      return;
    }
    if (!row.deliveryAgentActive) {
      next(new AppError(403, "DELIVERY_INACTIVE", "Delivery account is inactive"));
      return;
    }
    next();
    return;
  }

  next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
};
