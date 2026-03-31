import { Router } from "express";
import assistantRoutes from "./assistant.routes.js";
import authRoutes from "./auth.routes.js";
import orderRoutes from "./order.routes.js";
import paymentRoutes from "./payment.routes.js";
import productRoutes from "./product.routes.js";
import qrRoutes from "./qr.routes.js";
import sellerRoutes from "./seller.routes.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.use("/assistant", assistantRoutes);
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/sellers", sellerRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/qr", qrRoutes);

router.get("/admin/health", requireAuth, requireRoles("admin"), (_req, res) => {
  res.json({ ok: true, scope: "admin" });
});
