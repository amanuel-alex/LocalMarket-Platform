import { Router } from "express";
import authRoutes from "./auth.routes.js";
import orderRoutes from "./order.routes.js";
import productRoutes from "./product.routes.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

router.get("/admin/health", requireAuth, requireRoles("admin"), (_req, res) => {
  res.json({ ok: true, scope: "admin" });
});
