import { Router } from "express";
import * as sellerController from "../controllers/seller.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.patch("/location", requireAuth, requireRoles("seller"), sellerController.updateShopLocation);

export default router;
