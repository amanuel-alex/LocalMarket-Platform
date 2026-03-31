import { v2 as cloudinary } from "cloudinary";
import { getEnv } from "./env.js";

let configured = false;

export function isCloudinaryConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
  );
}

export function ensureCloudinaryConfigured(): void {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured (set CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET)");
  }
  if (!configured) {
    const env = getEnv();
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
}

export function getCloudinary(): typeof cloudinary {
  ensureCloudinaryConfigured();
  return cloudinary;
}

export function getUploadFolder(): string {
  return getEnv().CLOUDINARY_UPLOAD_FOLDER || "localmarket/products";
}
