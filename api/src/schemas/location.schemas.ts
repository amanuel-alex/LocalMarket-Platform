import { z } from "zod";

const latLngSchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
});

export const sellerShopLocationSchema = latLngSchema;

export type SellerShopLocationInput = z.infer<typeof sellerShopLocationSchema>;

/** Query string: lat, lng, optional radiusKm (km), optional limit. */
export const nearbyProductsQuerySchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
  radiusKm: z.coerce.number().positive().max(2000).optional(),
  limit: z.coerce.number().int().positive().max(200).optional().default(100),
});

export type NearbyProductsQuery = z.infer<typeof nearbyProductsQuerySchema>;
