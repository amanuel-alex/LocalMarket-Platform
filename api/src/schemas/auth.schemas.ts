import { z } from "zod";

export const preferredLocaleSchema = z.enum(["en", "am", "om"]);

/** JSON `POST /auth/register` — buyers only. Sellers and delivery use multipart `POST /auth/register-partner`. */
export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(3).max(32),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(8).max(128),
    /** Preferred language for notifications and translated API errors (`en` default if omitted). */
    locale: preferredLocaleSchema.optional(),
  })
  .strict();

export const partnerRegisterAccountTypeSchema = z.enum(["seller", "delivery"]);

/** Multipart text fields for `POST /auth/register-partner` (plus file field `proposal`). */
export const partnerRegisterFieldsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(3).max(32),
  password: z.string().min(8).max(128),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  about: z.string().trim().min(20).max(8000),
  accountType: partnerRegisterAccountTypeSchema,
  locale: preferredLocaleSchema.optional(),
});

export const updatePreferredLocaleBodySchema = z.object({
  locale: preferredLocaleSchema,
});

/** Sign in with the same value you used at signup: phone number or email address. */
export const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(16).max(512),
  password: z.string().min(8).max(128),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(32).max(512),
});

export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type PartnerRegisterFieldsInput = z.infer<typeof partnerRegisterFieldsSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePreferredLocaleBody = z.infer<typeof updatePreferredLocaleBodySchema>;
