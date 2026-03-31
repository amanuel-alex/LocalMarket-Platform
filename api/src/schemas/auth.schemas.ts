import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(3).max(32),
  password: z.string().min(8).max(128),
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
