import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("admin"));

router.post("/orders/:id/release-escrow", adminController.releaseOrderEscrow);

export default router;
