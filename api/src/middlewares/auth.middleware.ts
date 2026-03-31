import type { RequestHandler } from "express";
import { prisma } from "../prisma/client.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/errors.js";

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
    const user = await prisma.user.findUnique({
      where: { id: sub },
      select: { bannedAt: true },
    });
    if (user?.bannedAt != null) {
      next(new AppError(403, "ACCOUNT_BANNED", "This account has been suspended"));
      return;
    }
    req.user = { id: sub, role };
    next();
  } catch (e) {
    next(e);
  }
};
