import { Router } from "express";
import multer from "multer";
import * as uploadController from "../controllers/upload.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";
import { AppError } from "../utils/errors.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  "/product-image",
  requireAuth,
  requireRoles("seller"),
  (req, res, next) => {
    upload.single("image")(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        next(new AppError(400, "UPLOAD_ERROR", err.message));
        return;
      }
      next(err);
    });
  },
  uploadController.uploadProductImage,
);

export default router;
