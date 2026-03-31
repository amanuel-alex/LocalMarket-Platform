import { z } from "zod";

export const sellerInsightsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export type SellerInsightsQuery = z.infer<typeof sellerInsightsQuerySchema>;
