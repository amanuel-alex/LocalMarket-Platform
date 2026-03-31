import type { Product } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import type { NearbyProductsQuery } from "../schemas/location.schemas.js";
import type { CreateProductInput } from "../schemas/product.schemas.js";
import { haversineDistanceKm } from "../utils/haversine.js";
import { AppError } from "../utils/errors.js";

export type ProductJson = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: { lat: number; lng: number };
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NearbyProductJson = ProductJson & {
  distanceKm: number;
  locationSource: "seller" | "product";
};

function toProductJson(row: Product): ProductJson {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price.toNumber(),
    category: row.category,
    location: { lat: row.lat, lng: row.lng },
    sellerId: row.sellerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createProduct(sellerId: string, input: CreateProductInput): Promise<ProductJson> {
  const row = await prisma.product.create({
    data: {
      title: input.title,
      description: input.description,
      price: input.price,
      category: input.category,
      lat: input.location.lat,
      lng: input.location.lng,
      sellerId,
    },
  });
  return toProductJson(row);
}

export async function listProducts(): Promise<ProductJson[]> {
  const rows = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toProductJson);
}

/** Near `(query.lat, query.lng)`: uses seller shop coords when set, otherwise product listing coords. Sorted by Haversine distance ascending. */
export async function listNearbyProducts(query: NearbyProductsQuery): Promise<NearbyProductJson[]> {
  const rows = await prisma.product.findMany({
    include: { seller: { select: { sellerLat: true, sellerLng: true } } },
  });

  const enriched = rows.map((row) => {
    const useSeller =
      row.seller.sellerLat != null &&
      row.seller.sellerLng != null &&
      !Number.isNaN(row.seller.sellerLat) &&
      !Number.isNaN(row.seller.sellerLng);
    const lat = useSeller ? row.seller.sellerLat! : row.lat;
    const lng = useSeller ? row.seller.sellerLng! : row.lng;
    const locationSource = useSeller ? ("seller" as const) : ("product" as const);
    const distanceKm = haversineDistanceKm(query.lat, query.lng, lat, lng);
    return {
      ...toProductJson(row),
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      locationSource,
    };
  });

  const maxRadiusKm = query.radiusKm;
  const filtered =
    maxRadiusKm != null ? enriched.filter((p) => p.distanceKm <= maxRadiusKm) : enriched;

  return filtered.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, query.limit);
}

export async function getProductById(id: string): Promise<ProductJson> {
  const row = await prisma.product.findUnique({ where: { id } });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }
  return toProductJson(row);
}
