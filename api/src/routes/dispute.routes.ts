import { Router } from "express";
import * as disputeController from "../controllers/dispute.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/", requireRoles("buyer"), disputeController.create);
router.get("/", disputeController.list);

export default router;
