import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";
import { requireApprovedSeller } from "../middlewares/sellerApproval.middleware.js";

const router = Router();

router.get("/", productController.list);
router.get("/ranked", productController.ranked);
router.get("/nearby", productController.nearby);
router.get("/search", productController.search);
router.get("/:id/compare", productController.compare);
router.get("/:id/related", productController.related);
router.get("/:id", productController.getById);
router.post("/", requireAuth, requireRoles("seller"), requireApprovedSeller, productController.create);
router.patch("/:id", requireAuth, requireRoles("seller"), requireApprovedSeller, productController.update);
router.delete("/:id", requireAuth, requireRoles("seller"), requireApprovedSeller, productController.remove);

export default router;
