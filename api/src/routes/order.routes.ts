import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";
import { requireApprovedSeller } from "../middlewares/sellerApproval.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/", requireRoles("buyer"), orderController.create);
router.post("/:id/cancel", requireRoles("buyer"), orderController.cancelPending);
router.get("/", orderController.list);
router.post(
  "/:id/confirm-delivery",
  requireRoles("seller"),
  requireApprovedSeller,
  orderController.confirmDelivery,
);
router.patch(
  "/:id/assign-delivery",
  requireRoles("seller"),
  requireApprovedSeller,
  orderController.assignDelivery,
);
router.patch(
  "/:id/mark-ready",
  requireRoles("seller"),
  requireApprovedSeller,
  orderController.markReadyForPickup,
);
router.post("/:id/review", requireRoles("buyer"), orderController.submitReview);
router.get("/:id/receipt", orderController.receipt);
router.get("/:id", orderController.getById);

export default router;
