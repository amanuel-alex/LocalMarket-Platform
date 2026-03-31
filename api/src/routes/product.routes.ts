import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.get("/", productController.list);
router.get("/nearby", productController.nearby);
router.get("/search", productController.search);
router.get("/:id/compare", productController.compare);
router.get("/:id/related", productController.related);
router.get("/:id", productController.getById);
router.post("/", requireAuth, requireRoles("seller"), productController.create);

export default router;
