import { z } from "zod";

export const preferredLocaleSchema = z.enum(["en", "am", "om"]);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(3).max(32),
  password: z.string().min(8).max(128),
  /** Preferred language for notifications and translated API errors (`en` default if omitted). */
  locale: preferredLocaleSchema.optional(),
});

export const updatePreferredLocaleBodySchema = z.object({
  locale: preferredLocaleSchema,
});

export const loginSchema = z.object({
  phone: z.string().trim().min(3).max(32),
  password: z.string().min(1).max(128),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(32).max(512),
});

export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdatePreferredLocaleBody = z.infer<typeof updatePreferredLocaleBodySchema>;
