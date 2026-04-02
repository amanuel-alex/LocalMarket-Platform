import type { RequestHandler } from "express";
import { getEnv } from "../config/env.js";
import { isQueueInfrastructureEnabled } from "../queues/queueClient.js";
import { getRedis } from "../cache/redisClient.js";

/**
 * Public “wow / readiness” checklist for demos, sales, and client apps.
 */
export const checklist: RequestHandler = (_req, res) => {
  const env = getEnv();
  const redis = getRedis();

  const features = {
    apiVersioning: true,
    smartRanking: true,
    sellerTrustScore: true,
    hybridAssistant: true,
    productReviews: true,
    jwtShortLivedAccess: true,
    jwtRefreshTokens: true,
    rateLimiting: true,
    helmet: true,
    inputSanitization: true,
    prismaOrm: true,
    structuredLogging: true,
    adminMetrics: true,
    commissionEngine: true,
    sellerInsights: true,
    orderReceipts: true,
    inventoryStock: true,
    redisCache: Boolean(redis),
    backgroundJobs: isQueueInfrastructureEnabled(),
    cloudinaryUploads: Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY),
    mpesaCallbackSecret: Boolean(env.MPESA_CALLBACK_SECRET),
  };

  const checklistItems = [
    { id: "smart_ranking", label: "Smart ranking (price · distance · popularity · rating · trust)", ok: true },
    { id: "trust_score", label: "Seller trust score (deliveries · reviews · QR verification)", ok: true },
    { id: "hybrid_ai", label: "Assistant: rules + smart rank when user asks for best / popular / trusted", ok: true },
    { id: "security_stack", label: "Helmet · rate limits · sanitization · JWT access+refresh", ok: true },
    { id: "observability", label: "Pino logs · request/error DB logs · admin metrics summary", ok: true },
    { id: "business", label: "5% commission · seller insights · JSON receipts · stock / oversell guard", ok: true },
    { id: "redis", label: "Redis cache / queues", ok: features.redisCache },
    { id: "uploads", label: "Product image uploads", ok: features.cloudinaryUploads },
  ];

  res.json({
    ok: true,
    name: "LocalMarket API",
    features,
    checklist: checklistItems,
  });
};
