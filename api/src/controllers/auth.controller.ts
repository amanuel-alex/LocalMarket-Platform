import type { RequestHandler } from "express";
import {
  forgotPasswordSchema,
  loginSchema,
  partnerRegisterFieldsSchema,
  refreshTokenBodySchema,
  registerSchema,
  resetPasswordSchema,
  updatePreferredLocaleBodySchema,
} from "../schemas/auth.schemas.js";
import * as authService from "../services/auth.service.js";
import * as uploadService from "../services/upload.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { translateErrorCode } from "../i18n/errorMessages.js";

export const register: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const result = await authService.register(parsed.data);
  res.status(201).json(result);
});

export const registerPartner: RequestHandler = asyncHandler(async (req, res, next) => {
  const raw = {
    name: req.body?.name,
    phone: req.body?.phone,
    password: req.body?.password,
    email: req.body?.email,
    about: req.body?.about,
    accountType: req.body?.accountType,
    locale: req.body?.locale,
  };
  const parsed = partnerRegisterFieldsSchema.safeParse(raw);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  uploadService.assertPartnerProposalFile(req.file);
  let proposalUrl: string;
  try {
    proposalUrl = await uploadService.uploadPartnerProposalBuffer(req.file.buffer, req.file.mimetype);
  } catch (e) {
    throw new AppError(502, "UPLOAD_FAILED", e instanceof Error ? e.message : "Upload failed");
  }
  const result = await authService.registerPartner(parsed.data, proposalUrl);
  res.status(201).json(result);
});

export const login: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const result = await authService.login(parsed.data.identifier, parsed.data.password);
  res.json(result);
});

export const forgotPassword: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const result = await authService.requestPasswordReset(parsed.data.identifier);
  res.json(result);
});

export const resetPassword: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  await authService.resetPasswordWithToken(parsed.data.token, parsed.data.password);
  res.status(204).send();
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

export const otpNotImplemented: RequestHandler = (req, res) => {
  const locale = req.locale ?? "en";
  res.status(501).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: translateErrorCode(
        locale,
        "NOT_IMPLEMENTED_SMS",
        "SMS/OTP is not enabled yet. This route is rate-limited for future integration.",
      ),
    },
  });
};

export const me: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const user = await authService.getProfile(userId);
  res.json({ user });
});

export const patchMeLocale: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = updatePreferredLocaleBodySchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const user = await authService.updatePreferredLocale(req.user!.id, parsed.data.locale);
  res.json({ user });
});
