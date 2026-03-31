import { z } from "zod";

export const sellerInsightsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export type SellerInsightsQuery = z.infer<typeof sellerInsightsQuerySchema>;

export const sellerIdParamSchema = z.object({
  sellerId: z.string().cuid(),
});

export type SellerIdParam = z.infer<typeof sellerIdParamSchema>;
