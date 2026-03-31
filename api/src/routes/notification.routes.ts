import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", notificationController.list);
router.patch("/:id/read", notificationController.markRead);

export default router;
