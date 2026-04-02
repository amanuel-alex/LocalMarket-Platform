import { Router } from "express";
import * as deliveryController from "../controllers/delivery.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(requireAuth, requireRoles("delivery"));

router.get("/assignments", deliveryController.listAssignments);
router.get("/assignments/:id", deliveryController.getAssignment);
router.post("/assignments/:id/start", deliveryController.startAssignment);

export default router;
