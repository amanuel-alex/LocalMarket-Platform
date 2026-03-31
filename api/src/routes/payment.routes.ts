import { Router } from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireMpesaCallbackSecret } from "../middlewares/mpesaCallback.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/initiate", requireAuth, requireRoles("buyer"), paymentController.initiate);
router.post("/callback", requireMpesaCallbackSecret, paymentController.callback);

export default router;
