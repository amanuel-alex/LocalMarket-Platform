import { Router } from "express";
import adminRoutes from "../../routes/admin.routes.js";
import assistantRoutes from "../../routes/assistant.routes.js";
import authRoutes from "../../routes/auth.routes.js";
import disputeRoutes from "../../routes/dispute.routes.js";
import notificationRoutes from "../../routes/notification.routes.js";
import orderRoutes from "../../routes/order.routes.js";
import paymentRoutes from "../../routes/payment.routes.js";
import payoutRoutes from "../../routes/payout.routes.js";
import productRoutes from "../../routes/product.routes.js";
import qrRoutes from "../../routes/qr.routes.js";
import sellerRoutes from "../../routes/seller.routes.js";
import uploadRoutes from "../../routes/upload.routes.js";
import walletRoutes from "../../routes/wallet.routes.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { globalApiRateLimiter } from "../../middlewares/rateLimit.middleware.js";
import { requireRoles } from "../../middlewares/role.middleware.js";

/** Versioned HTTP API (current). Mount at `/api/v1` and, for compatibility, at `/`. */
export const v1Router = Router();

v1Router.get("/health", (_req, res) => {
  res.json({ ok: true, apiVersion: 1 });
});

v1Router.use(globalApiRateLimiter);

/* Logical domains (monolith — future extractable services): assistant, auth, catalog, orders, payments, notifications, wallets. */
v1Router.use("/assistant", assistantRoutes);
v1Router.use("/auth", authRoutes);
v1Router.use("/products", productRoutes);
v1Router.use("/sellers", sellerRoutes);
v1Router.use("/uploads", uploadRoutes);
v1Router.use("/orders", orderRoutes);
v1Router.use("/disputes", disputeRoutes);
v1Router.use("/notifications", notificationRoutes);
v1Router.use("/payments", paymentRoutes);
v1Router.use("/qr", qrRoutes);
v1Router.use("/wallets", walletRoutes);
v1Router.use("/payouts", payoutRoutes);

v1Router.get("/admin/health", requireAuth, requireRoles("admin"), (_req, res) => {
  res.json({ ok: true, scope: "admin", apiVersion: 1 });
});

v1Router.use("/admin", adminRoutes);
