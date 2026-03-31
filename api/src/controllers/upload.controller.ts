import type { RequestHandler } from "express";
import { isCloudinaryConfigured } from "../config/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import * as uploadService from "../services/upload.service.js";

export const uploadProductImage: RequestHandler = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      503,
      "UPLOAD_DISABLED",
      "Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
  uploadService.assertImageFile(req.file);
  try {
    const imageUrl = await uploadService.uploadProductImageBuffer(req.file.buffer);
    res.json({ imageUrl });
  } catch (e) {
    throw new AppError(
      502,
      "UPLOAD_FAILED",
      e instanceof Error ? e.message : "Upload failed",
    );
  }
});
