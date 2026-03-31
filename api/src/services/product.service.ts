import { Prisma, type Product } from "@prisma/client";
import {
  bumpProductCatalogCacheEpoch,
  cacheGetOrSetNearby,
  cacheGetOrSetProductById,
  cacheGetOrSetProductList,
  cacheGetOrSetRelated,
} from "../cache/productCatalog.cache.js";
import { prisma } from "../prisma/client.js";
import type { NearbyProductsQuery } from "../schemas/location.schemas.js";
import type { CreateProductInput, ProductSearchQuery } from "../schemas/product.schemas.js";
import { haversineDistanceKm } from "../utils/haversine.js";
import { AppError } from "../utils/errors.js";

/** Multiplicative band around anchor price for “similar” related items (±30%). */
const RELATED_PRICE_MIN_FACTOR = 0.7;
const RELATED_PRICE_MAX_FACTOR = 1.3;
/** Cap rows read from DB before in-memory sort by price proximity (index-friendly filters already applied). */
const RELATED_CANDIDATE_CAP = 48;
const RELATED_RESULT_LIMIT = 6;
/** Max rows loaded from DB before in-memory location filter / sort (text and price use Prisma where). */
const SEARCH_FETCH_CAP = 500;

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
  productGroupId: string | null;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NearbyProductJson = ProductJson & {
  distanceKm: number;
  locationSource: "seller" | "product";
};

export type SearchProductJson = ProductJson & {
  distanceKm?: number;
  locationSource?: "seller" | "product";
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
    productGroupId: row.productGroupId ?? null,
    sellerId: row.sellerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createProduct(sellerId: string, input: CreateProductInput): Promise<ProductJson> {
  if (input.productGroupId) {
    const g = await prisma.productGroup.findUnique({ where: { id: input.productGroupId } });
    if (!g) {
      throw new AppError(404, "NOT_FOUND", "Product group not found");
    }
  }

  const row = await prisma.product.create({
    data: {
      title: input.title,
      description: input.description,
      price: input.price,
      category: input.category,
      lat: input.location.lat,
      lng: input.location.lng,
      imageUrl: input.imageUrl ?? null,
      productGroupId: input.productGroupId ?? null,
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

export async function searchProducts(query: ProductSearchQuery): Promise<SearchProductJson[]> {
  const where: Prisma.ProductWhereInput = {};

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) {
      where.price.gte = new Prisma.Decimal(query.minPrice);
    }
    if (query.maxPrice !== undefined) {
      where.price.lte = new Prisma.Decimal(query.maxPrice);
    }
  }

  const rows = await prisma.product.findMany({
    where,
    include: { seller: { select: { sellerLat: true, sellerLng: true } } },
    orderBy: { updatedAt: "desc" },
    take: SEARCH_FETCH_CAP,
  });

  const hasLocation =
    query.lat !== undefined &&
    query.lng !== undefined &&
    query.radiusKm !== undefined;

  if (!hasLocation) {
    return rows.slice(0, query.limit).map((row) => toProductJson(row));
  }

  const lat0 = query.lat!;
  const lng0 = query.lng!;
  const radiusKm = query.radiusKm!;

  const withDistance = rows.map((row) => {
    const useSeller =
      row.seller.sellerLat != null &&
      row.seller.sellerLng != null &&
      !Number.isNaN(row.seller.sellerLat) &&
      !Number.isNaN(row.seller.sellerLng);
    const lat = useSeller ? row.seller.sellerLat! : row.lat;
    const lng = useSeller ? row.seller.sellerLng! : row.lng;
    const locationSource = useSeller ? ("seller" as const) : ("product" as const);
    const distanceKm = haversineDistanceKm(lat0, lng0, lat, lng);
    return {
      ...toProductJson(row),
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      locationSource,
    };
  });

  return withDistance
    .filter((p) => p.distanceKm! <= radiusKm)
    .sort((a, b) => a.distanceKm! - b.distanceKm!)
    .slice(0, query.limit);
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
    const anchorPriceNum = anchor.price.toNumber();

    if (anchor.productGroupId) {
      const rows = await prisma.product.findMany({
        where: { productGroupId: anchor.productGroupId, id: { not: anchor.id } },
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
    }

    const minPrice = anchor.price.times(RELATED_PRICE_MIN_FACTOR);
    const maxPrice = anchor.price.times(RELATED_PRICE_MAX_FACTOR);

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

/** Same `productGroupId` listings (price comparison). Empty if the product has no group. */
export async function listProductGroupComparisons(anchorProductId: string): Promise<{
  productGroupId: string | null;
  products: ProductJson[];
}> {
  const anchor = await prisma.product.findUnique({ where: { id: anchorProductId } });
  if (!anchor) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }
  if (!anchor.productGroupId) {
    return { productGroupId: null, products: [] };
  }
  const rows = await prisma.product.findMany({
    where: { productGroupId: anchor.productGroupId },
    orderBy: [{ price: "asc" }, { updatedAt: "desc" }],
  });
  return {
    productGroupId: anchor.productGroupId,
    products: rows.map(toProductJson),
  };
}

export async function adminAssignProductGroup(
  productId: string,
  productGroupId: string | null,
): Promise<ProductJson> {
  if (productGroupId) {
    const g = await prisma.productGroup.findUnique({ where: { id: productGroupId } });
    if (!g) {
      throw new AppError(404, "NOT_FOUND", "Product group not found");
    }
  }
  const exists = await prisma.product.findUnique({ where: { id: productId } });
  if (!exists) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }
  const row = await prisma.product.update({
    where: { id: productId },
    data: { productGroupId },
  });
  await bumpProductCatalogCacheEpoch();
  return toProductJson(row);
}

export async function createProductGroup(label?: string | null): Promise<{ id: string; label: string | null }> {
  const row = await prisma.productGroup.create({
    data: { label: label?.trim() ? label.trim() : null },
  });
  return { id: row.id, label: row.label };
}
