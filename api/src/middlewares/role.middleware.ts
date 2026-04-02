import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "../utils/errors.js";

export function requireRoles(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
      return;
    }
    if (!allowed.includes(req.user.role)) {
      next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
      return;
    }
    next();
  };
}

/** Logistics staff: legacy `delivery` role and `delivery_agent`. */
export function requireDeliveryRoles(): RequestHandler {
  return requireRoles("delivery", "delivery_agent");
}
