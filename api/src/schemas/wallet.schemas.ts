import { z } from "zod";

export const payoutRequestSchema = z.object({
  amount: z.number().positive().finite(),
});

export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;

export const payoutIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const transactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});
