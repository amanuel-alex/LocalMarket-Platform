import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  /** Short-lived access JWT (e.g. 15m). */
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  /** Opaque refresh token storage TTL in DB (e.g. 7d). */
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().int().min(3).max(50).default(5),
  LOCKOUT_MINUTES: z.coerce.number().int().min(1).max(1440).default(30),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  /** If set, POST /payments/callback must send header X-Callback-Secret with this value (Daraja uses different verification; this is a simple hook for prod). */
  MPESA_CALLBACK_SECRET: z.string().optional().default(""),
  /** Set to "1" behind a reverse proxy so rate limits use X-Forwarded-For. */
  TRUST_PROXY: z
    .enum(["0", "1"])
    .optional()
    .default("0")
    .transform((v) => v === "1"),
  /** Product image uploads (Cloudinary). Leave empty to disable POST /uploads/product-image. */
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  /** Prefix for uploaded images, e.g. `localmarket/products`. */
  CLOUDINARY_UPLOAD_FOLDER: z.string().optional().default("localmarket/products"),
  /** Optional: Redis for product list / nearby / related caching (e.g. redis://localhost:6379). */
  REDIS_URL: z.string().optional().default(""),
  /** Age in days for request/error log retention (background cleanup job). */
  CLEANUP_LOG_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650).default(90),
  /** If set, POST /assistant/openai/chat uses OpenAI function calling + catalog tools. */
  OPENAI_API_KEY: z.string().optional().default(""),
  /** Chat model for assistant (e.g. gpt-4o-mini, gpt-4o). */
  OPENAI_MODEL: z.string().optional().default("gpt-4o-mini"),
  /** Google AI Studio / Gemini API key for POST /assistant/gemini/chat (function calling + catalog tools). */
  GOOGLE_AI_API_KEY: z.string().optional().default(""),
  /** Gemini model id (e.g. gemini-2.0-flash, gemini-1.5-flash). */
  GEMINI_MODEL: z.string().optional().default("gemini-1.5-flash"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    cached = schema.parse(process.env);
  }
  return cached;
}

export function resetEnvCache(): void {
  cached = null;
}
