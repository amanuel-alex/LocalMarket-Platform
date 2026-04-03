import { Router } from "express";
import multer from "multer";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  loginRateLimiter,
  otpSendRateLimiter,
  otpVerifyRateLimiter,
  refreshRateLimiter,
  registerRateLimiter,
} from "../middlewares/rateLimit.middleware.js";
import { AppError } from "../utils/errors.js";

const router = Router();

const partnerRegisterUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/register", registerRateLimiter, authController.register);
router.post(
  "/register-partner",
  registerRateLimiter,
  (req, res, next) => {
    partnerRegisterUpload.single("proposal")(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        next(new AppError(400, "UPLOAD_ERROR", err.message));
        return;
      }
      next(err);
    });
  },
  authController.registerPartner,
);
router.post("/login", loginRateLimiter, authController.login);
router.post("/refresh", refreshRateLimiter, authController.refresh);
router.post("/logout", refreshRateLimiter, authController.logout);
router.post("/otp/send", otpSendRateLimiter, authController.otpNotImplemented);
router.post("/otp/verify", otpVerifyRateLimiter, authController.otpNotImplemented);
router.get("/me", requireAuth, authController.me);
router.patch("/me/locale", requireAuth, authController.patchMeLocale);

export default router;
