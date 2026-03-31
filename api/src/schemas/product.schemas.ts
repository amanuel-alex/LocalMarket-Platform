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
  imageUrl: z.string().url().max(2048).optional(),
  /** Optional catalog group (same item across sellers) for price compare / related. */
  productGroupId: z.string().cuid().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const productIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;

/** `GET /products` pagination (defaults match common client expectations). */
export const productListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

/** Smart ranking: optional buyer location for distance; optional category filter. */
export const productRankedQuerySchema = z
  .object({
    lat: z.coerce.number().gte(-90).lte(90).optional(),
    lng: z.coerce.number().gte(-180).lte(180).optional(),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    category: z
      .string()
      .max(120)
      .optional()
      .transform((v) => (v?.trim() ? v.trim() : undefined)),
  })
  .superRefine((data, ctx) => {
    const hasLat = data.lat !== undefined;
    const hasLng = data.lng !== undefined;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "lat and lng must both be provided for distance-aware ranking",
        path: hasLat ? ["lng"] : ["lat"],
      });
    }
  });

export type ProductRankedQuery = z.infer<typeof productRankedQuerySchema>;

/** Query: search text (title/description), optional price range, optional location radius (lat+lng+radiusKm). */
export const productSearchQuerySchema = z
  .object({
    q: z
      .string()
      .max(200)
      .optional()
      .transform((val) => {
        if (val === undefined) return undefined;
        const t = val.trim();
        return t.length === 0 ? undefined : t;
      }),
    minPrice: z.coerce.number().nonnegative().finite().optional(),
    maxPrice: z.coerce.number().positive().finite().optional(),
    lat: z.coerce.number().gte(-90).lte(90).optional(),
    lng: z.coerce.number().gte(-180).lte(180).optional(),
    radiusKm: z.coerce.number().positive().max(2000).optional(),
    limit: z.coerce.number().int().positive().max(200).optional().default(50),
  })
  .superRefine((data, ctx) => {
    const hasLat = data.lat !== undefined;
    const hasLng = data.lng !== undefined;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "lat and lng must both be provided for a location filter",
        path: hasLat ? ["lng"] : ["lat"],
      });
    }
    if (hasLat && data.radiusKm === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "radiusKm is required when filtering by location",
        path: ["radiusKm"],
      });
    }
    if (
      data.minPrice !== undefined &&
      data.maxPrice !== undefined &&
      data.minPrice > data.maxPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minPrice must be less than or equal to maxPrice",
        path: ["minPrice"],
      });
    }
    const hasQ = data.q !== undefined;
    const hasPrice = data.minPrice !== undefined || data.maxPrice !== undefined;
    const hasLoc = hasLat;
    if (!hasQ && !hasPrice && !hasLoc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one of: q (name/text), minPrice and/or maxPrice, or lat/lng/radiusKm",
      });
    }
  });

export type ProductSearchQuery = z.infer<typeof productSearchQuerySchema>;
