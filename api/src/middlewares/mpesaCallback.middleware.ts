import type { RequestHandler } from "express";
import { getEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";

/**
 * When MPESA_CALLBACK_SECRET is set, require matching `X-Callback-Secret` header.
 * Real Daraja uses RSA signature verification; this is a minimal stand-in for production.
 */
export const requireMpesaCallbackSecret: RequestHandler = (req, _res, next) => {
  const secret = getEnv().MPESA_CALLBACK_SECRET;
  if (!secret) {
    next();
    return;
  }
  const header = req.headers["x-callback-secret"];
  if (typeof header !== "string" || header !== secret) {
    next(new AppError(401, "UNAUTHORIZED", "Invalid or missing X-Callback-Secret"));
    return;
  }
  next();
};
