import { Router } from "express";
import * as payoutController from "../controllers/payout.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";
import { requireApprovedSeller } from "../middlewares/sellerApproval.middleware.js";

const router = Router();

router.post("/", requireAuth, requireRoles("seller"), requireApprovedSeller, payoutController.requestPayout);
router.get("/", requireAuth, requireRoles("seller"), requireApprovedSeller, payoutController.listMine);

router.post(
  "/:id/mark-paid",
  requireAuth,
  requireRoles("admin"),
  payoutController.adminMarkPaid,
);
router.post(
  "/:id/cancel",
  requireAuth,
  requireRoles("admin"),
  payoutController.adminCancel,
);

export default router;
