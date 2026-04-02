import type { RequestHandler } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/errors.js";
import { assertUserNotSuspended } from "../services/userAccess.service.js";
import * as suspiciousActivity from "../services/suspiciousActivity.service.js";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next(new AppError(401, "UNAUTHORIZED", "Missing or invalid Authorization header"));
    return;
  }
  const token = header.slice(7).trim();
  if (!token) {
    next(new AppError(401, "UNAUTHORIZED", "Missing token"));
    return;
  }
  try {
    const { sub, role } = verifyAccessToken(token);
    try {
      await assertUserNotSuspended(sub);
    } catch (e) {
      if (e instanceof AppError && e.code === "ACCOUNT_BANNED") {
        suspiciousActivity.logSuspiciousActivity("api.token.blocked_user", { userId: sub });
      }
      throw e;
    }
    req.user = { id: sub, role };
    next();
  } catch (e) {
    next(e);
  }
};
