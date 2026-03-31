import { Router } from "express";
import * as walletController from "../controllers/wallet.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/me", walletController.me);
router.get("/me/transactions", walletController.transactions);

export default router;
