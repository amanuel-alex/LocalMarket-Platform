import { Router } from "express";
import * as deliveryController from "../controllers/delivery.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireApprovedDeliveryAgent } from "../middlewares/deliveryAgent.middleware.js";
import { requireDeliveryRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(requireAuth, requireDeliveryRoles(), requireApprovedDeliveryAgent);

router.get("/assignments", deliveryController.listAssignments);
router.get("/assignments/:id", deliveryController.getAssignment);
router.post("/assignments/:id/start", deliveryController.startAssignment);

router.get("/orders", deliveryController.listOrders);
router.patch("/orders/:id/pickup", deliveryController.pickupOrder);
router.patch("/orders/:id/deliver", deliveryController.deliverOrder);

export default router;
