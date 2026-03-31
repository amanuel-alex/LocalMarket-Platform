import { z } from "zod";

export const submitOrderReviewBodySchema = z.object({
  stars: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(4000).optional(),
});

export type SubmitOrderReviewBody = z.infer<typeof submitOrderReviewBodySchema>;
