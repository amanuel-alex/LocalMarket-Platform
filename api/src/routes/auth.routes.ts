import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  loginRateLimiter,
  otpSendRateLimiter,
  otpVerifyRateLimiter,
  refreshRateLimiter,
  registerRateLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post("/register", registerRateLimiter, authController.register);
router.post("/login", loginRateLimiter, authController.login);
router.post("/refresh", refreshRateLimiter, authController.refresh);
router.post("/logout", refreshRateLimiter, authController.logout);
router.post("/otp/send", otpSendRateLimiter, authController.otpNotImplemented);
router.post("/otp/verify", otpVerifyRateLimiter, authController.otpNotImplemented);
router.get("/me", requireAuth, authController.me);
router.patch("/me/locale", requireAuth, authController.patchMeLocale);

export default router;
