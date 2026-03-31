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
