import type { Prisma, Product } from "@prisma/client";
import {
  bumpProductCatalogCacheEpoch,
  cacheGetOrSetNearby,
  cacheGetOrSetProductById,
  cacheGetOrSetProductList,
  cacheGetOrSetRelated,
} from "../cache/productCatalog.cache.js";
import { prisma } from "../prisma/client.js";
import type { NearbyProductsQuery } from "../schemas/location.schemas.js";
import type { CreateProductInput } from "../schemas/product.schemas.js";
import { haversineDistanceKm } from "../utils/haversine.js";
import { AppError } from "../utils/errors.js";

/** Multiplicative band around anchor price for “similar” related items (±30%). */
const RELATED_PRICE_MIN_FACTOR = 0.7;
const RELATED_PRICE_MAX_FACTOR = 1.3;
/** Cap rows read from DB before in-memory sort by price proximity (index-friendly filters already applied). */
const RELATED_CANDIDATE_CAP = 48;
const RELATED_RESULT_LIMIT = 6;

type ProductRowWithSellerCoords = Prisma.ProductGetPayload<{
  include: { seller: { select: { sellerLat: true; sellerLng: true } } };
}>;

export type ProductJson = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: { lat: number; lng: number };
  imageUrl: string | null;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NearbyProductJson = ProductJson & {
  distanceKm: number;
  locationSource: "seller" | "product";
};

export function toProductJson(row: Product): ProductJson {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price.toNumber(),
    category: row.category,
    location: { lat: row.lat, lng: row.lng },
    imageUrl: row.imageUrl ?? null,
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
      imageUrl: input.imageUrl ?? null,
      sellerId,
    },
  });
  await bumpProductCatalogCacheEpoch();
  return toProductJson(row);
}

export async function listProducts(): Promise<ProductJson[]> {
  return cacheGetOrSetProductList(async () => {
    const rows = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toProductJson);
  });
}

function computeNearbyProducts(query: NearbyProductsQuery, rows: ProductRowWithSellerCoords[]): NearbyProductJson[] {
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

/** Near `(query.lat, query.lng)`: uses seller shop coords when set, otherwise product listing coords. Sorted by Haversine distance ascending. */
export async function listNearbyProducts(query: NearbyProductsQuery): Promise<NearbyProductJson[]> {
  return cacheGetOrSetNearby(query, async () => {
    const rows = await prisma.product.findMany({
      include: { seller: { select: { sellerLat: true, sellerLng: true } } },
    });
    return computeNearbyProducts(query, rows);
  });
}

export async function getProductById(id: string): Promise<ProductJson> {
  const json = await cacheGetOrSetProductById(id, async () => {
    const row = await prisma.product.findUnique({ where: { id } });
    return row ? toProductJson(row) : null;
  });
  if (!json) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }
  return json;
}

/**
 * Same category, similar price (±30%), excludes anchor product.
 * One indexed query + small in-memory sort by closest price (then recency).
 */
export async function listRelatedProducts(anchorProductId: string): Promise<ProductJson[]> {
  const anchor = await prisma.product.findUnique({ where: { id: anchorProductId } });
  if (!anchor) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  return cacheGetOrSetRelated(anchorProductId, async () => {
    const minPrice = anchor.price.times(RELATED_PRICE_MIN_FACTOR);
    const maxPrice = anchor.price.times(RELATED_PRICE_MAX_FACTOR);
    const anchorPriceNum = anchor.price.toNumber();

    const rows = await prisma.product.findMany({
      where: {
        category: anchor.category,
        id: { not: anchor.id },
        price: { gte: minPrice, lte: maxPrice },
      },
      orderBy: { updatedAt: "desc" },
      take: RELATED_CANDIDATE_CAP,
    });

    const withGap = rows.map((row) => ({
      row,
      gap: Math.abs(row.price.toNumber() - anchorPriceNum),
    }));

    withGap.sort((a, b) =>
      a.gap !== b.gap ? a.gap - b.gap : b.row.updatedAt.getTime() - a.row.updatedAt.getTime(),
    );

    return withGap.slice(0, RELATED_RESULT_LIMIT).map(({ row }) => toProductJson(row));
  });
}
