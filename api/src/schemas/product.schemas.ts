import { z } from "zod";

const locationSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

export const createProductSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(10_000),
  price: z.number().positive().finite(),
  category: z.string().trim().min(1).max(120),
  location: locationSchema,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const productIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;
