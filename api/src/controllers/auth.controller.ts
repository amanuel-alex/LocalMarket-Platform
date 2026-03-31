import type { RequestHandler } from "express";
import {
  loginSchema,
  refreshTokenBodySchema,
  registerSchema,
} from "../schemas/auth.schemas.js";
import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const register: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const result = await authService.register(parsed.data);
  res.status(201).json(result);
});

export const login: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const result = await authService.login(parsed.data.phone, parsed.data.password);
  res.json(result);
});

export const refresh: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = refreshTokenBodySchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const result = await authService.refreshSession(parsed.data.refreshToken);
  res.json(result);
});

export const logout: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = refreshTokenBodySchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  await authService.logoutSession(parsed.data.refreshToken);
  res.status(204).send();
});

export const otpNotImplemented: RequestHandler = (_req, res) => {
  res.status(501).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: "SMS/OTP is not enabled yet. This route is rate-limited for future integration.",
    },
  });
};

export const me: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const user = await authService.getProfile(userId);
  res.json({ user });
});
