import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import * as disputeController from "../controllers/dispute.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("admin"));

router.post("/orders/:id/release-escrow", adminController.releaseOrderEscrow);
router.patch("/orders/:id", adminController.overrideOrder);
router.patch("/disputes/:id", disputeController.adminUpdateStatus);
router.get("/analytics", adminController.getSystemAnalytics);
router.get("/logs/requests", adminController.listRequestLogs);
router.get("/logs/errors", adminController.listErrorLogs);
router.get("/settings", adminController.getSettings);
router.patch("/settings/commission", adminController.patchCommission);
router.post("/users/:id/ban", adminController.banUser);
router.post("/users/:id/unban", adminController.unbanUser);
router.post("/product-groups", adminController.createProductGroup);
router.patch("/products/:id/group", adminController.assignProductGroup);

export default router;
