import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import type { Options, RateLimitExceededEventHandler } from "express-rate-limit";
import {
  translateRateLimitMessage,
  type RateLimitReason,
} from "../i18n/rateLimitMessages.js";

const isTest = process.env.NODE_ENV === "test";

function i18nRateLimitHandler(reason: RateLimitReason): RateLimitExceededEventHandler {
  return (req: Request, res: Response, _next: NextFunction, optionsUsed: Options) => {
    const locale = req.locale ?? "en";
    const message = translateRateLimitMessage(locale, reason);
    res.status(optionsUsed.statusCode).json({
      error: { code: "RATE_LIMITED" as const, message },
    });
  };
}

const limiterBase = {
  standardHeaders: true,
  legacyHeaders: false,
} as const;

/** Brute-force protection: login failures. */
export const loginRateLimiter = rateLimit({
  ...limiterBase,
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10_000 : 5,
  handler: i18nRateLimitHandler("login"),
});

/** New account abuse / enumeration cooling. */
export const registerRateLimiter = rateLimit({
  ...limiterBase,
  windowMs: 60 * 60 * 1000,
  max: isTest ? 10_000 : 10,
  handler: i18nRateLimitHandler("register"),
});

export const refreshRateLimiter = rateLimit({
  ...limiterBase,
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10_000 : 30,
  handler: i18nRateLimitHandler("refresh"),
});

/** Reserved for SMS / OTP send when you wire a provider. */
export const otpSendRateLimiter = rateLimit({
  ...limiterBase,
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10_000 : 3,
  handler: i18nRateLimitHandler("otp_send"),
});

/** Reserved for OTP verify attempts. */
export const otpVerifyRateLimiter = rateLimit({
  ...limiterBase,
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10_000 : 3,
  handler: i18nRateLimitHandler("otp_verify"),
});

/** OpenAI assistant (cost control). */
export const assistantOpenAiRateLimiter = rateLimit({
  ...limiterBase,
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10_000 : 40,
  handler: i18nRateLimitHandler("global"),
  skip: () => isTest,
});

/** Broad API protection (per IP). Skipped in `NODE_ENV=test`. */
export const globalApiRateLimiter = rateLimit({
  ...limiterBase,
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1_000_000 : 400,
  handler: i18nRateLimitHandler("global"),
  skip: () => isTest,
});

/** Stricter limit for payment callback / webhooks. */
export const paymentCallbackRateLimiter = rateLimit({
  ...limiterBase,
  windowMs: 60 * 1000,
  max: isTest ? 50_000 : 120,
  handler: i18nRateLimitHandler("payment_callback"),
});
