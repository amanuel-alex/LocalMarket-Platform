import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import * as disputeController from "../controllers/dispute.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("admin"));

router.post("/orders/:id/release-escrow", adminController.releaseOrderEscrow);
router.patch("/disputes/:id", disputeController.adminUpdateStatus);
router.get("/analytics", adminController.getSystemAnalytics);
router.get("/logs/requests", adminController.listRequestLogs);
router.get("/logs/errors", adminController.listErrorLogs);

export default router;
