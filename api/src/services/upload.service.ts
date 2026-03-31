import { getCloudinary, getUploadFolder } from "../config/cloudinary.js";
import { AppError } from "../utils/errors.js";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024;

export function assertImageFile(
  file: globalThis.Express.Multer.File | undefined,
): asserts file is globalThis.Express.Multer.File {
  if (!file?.buffer?.length) {
    throw new AppError(400, "VALIDATION_ERROR", "Missing image file (field name: image)");
  }
  if (!ALLOWED_MIME.has(file.mimetype)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      `Unsupported type ${file.mimetype}; use jpeg, png, webp, or gif`,
    );
  }
  if (file.buffer.length > MAX_BYTES) {
    throw new AppError(400, "VALIDATION_ERROR", "Image too large (max 5MB)");
  }
}

export async function uploadProductImageBuffer(buffer: Buffer): Promise<string> {
  const cloudinary = getCloudinary();
  const folder = getUploadFolder();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (!result?.secure_url) {
          reject(new Error("Cloudinary returned no URL"));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}
