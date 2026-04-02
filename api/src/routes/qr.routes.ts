import { Router } from "express";
import * as qrController from "../controllers/qr.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";
import { requireApprovedQrActor } from "../middlewares/sellerApproval.middleware.js";

const router = Router();

router.post(
  "/verify",
  requireAuth,
  requireRoles("seller", "delivery", "delivery_agent"),
  requireApprovedQrActor,
  qrController.verify,
);

export default router;
