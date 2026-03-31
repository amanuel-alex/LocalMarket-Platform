import { z } from "zod";

export const createOrderSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().positive().max(9999).default(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
