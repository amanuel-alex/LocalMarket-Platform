import { Router } from "express";
import * as sellerController from "../controllers/seller.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";
import { requireApprovedSeller } from "../middlewares/sellerApproval.middleware.js";

const router = Router();

router.patch(
  "/location",
  requireAuth,
  requireRoles("seller"),
  requireApprovedSeller,
  sellerController.updateShopLocation,
);
router.get("/insights", requireAuth, requireRoles("seller"), requireApprovedSeller, sellerController.insights);
router.get("/:sellerId/trust", sellerController.publicTrust);

export default router;
