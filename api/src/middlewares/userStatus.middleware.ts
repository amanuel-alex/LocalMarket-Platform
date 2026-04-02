import type { RequestHandler } from "express";
import { assertUserNotSuspended } from "../services/userAccess.service.js";
import { AppError } from "../utils/errors.js";

/**
 * Re-validates account status from the database (use after `requireAuth`).
 * `requireAuth` already enforces the same rule; this is available for explicit route groups
 * or future auth paths that set `req.user` without the shared guard.
 */
export const checkUserStatus: RequestHandler = async (req, _res, next) => {
  if (!req.user?.id) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
    return;
  }
  try {
    await assertUserNotSuspended(req.user.id);
    next();
  } catch (e) {
    next(e);
  }
};
