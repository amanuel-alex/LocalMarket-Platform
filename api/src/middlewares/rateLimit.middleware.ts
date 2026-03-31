import rateLimit from "express-rate-limit";

const json429 = (message: string) => ({
  error: { code: "RATE_LIMITED" as const, message },
});

const isTest = process.env.NODE_ENV === "test";

/** Brute-force protection: login failures. */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10_000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: json429("Too many login attempts from this IP. Try again in a few minutes."),
});

/** New account abuse / enumeration cooling. */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTest ? 10_000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: json429("Too many registrations from this IP. Try again later."),
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10_000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: json429("Too many token refresh requests. Try again in a few minutes."),
});

/** Reserved for SMS / OTP send when you wire a provider. */
export const otpSendRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10_000 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: json429("Too many OTP requests. Try again later."),
});

/** Reserved for OTP verify attempts. */
export const otpVerifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10_000 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: json429("Too many OTP verification attempts. Try again later."),
});
