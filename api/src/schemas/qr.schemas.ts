import { z } from "zod";

/** Raw token from QR (base64url, 32 bytes → ~43 chars). */
export const verifyQrSchema = z.object({
  token: z.string().trim().min(32).max(128),
});

export type VerifyQrInput = z.infer<typeof verifyQrSchema>;
