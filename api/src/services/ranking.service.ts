import { prisma } from "../prisma/client.js";
import { cacheGetOrSetRanked, rankedQueryFingerprint } from "../cache/productCatalog.cache.js";
import type { ProductWithSellerCoords } from "../repositories/product.repository.js";
import * as productRepo from "../repositories/product.repository.js";
import { haversineDistanceKm } from "../utils/haversine.js";
import type { ProductJson } from "./product.service.js";
import { toProductJson } from "./product.service.js";
import { computeSellerTrust } from "./trust.service.js";

/** Tunable weights for the smart ranker (sum need not be 1; we re-normalize). */
const W_PRICE = 0.28;
const W_DISTANCE = 0.3;
const W_POPULARITY = 0.24;
const W_RATING = 0.18;

const RANK_FETCH_CAP = 400;

export type RankComponents = {
  price: number;
  distance: number;
  popularity: number;
  rating: number;
};

export type RankedProductJson = ProductJson & {
  distanceKm: number;
  locationSource: "seller" | "product";
  rankScore: number;
  rankComponents: RankComponents;
  sellerTrustScore: number;
};

function resolveCoords(row: ProductWithSellerCoords): {
  lat: number;
  lng: number;
  locationSource: "seller" | "product";
} {
  const useSeller =
    row.seller.sellerLat != null &&
    row.seller.sellerLng != null &&
    !Number.isNaN(row.seller.sellerLat) &&
    !Number.isNaN(row.seller.sellerLng);
  if (useSeller) {
    return {
      lat: row.seller.sellerLat!,
      lng: row.seller.sellerLng!,
      locationSource: "seller",
    };
  }
  return { lat: row.lat, lng: row.lng, locationSource: "product" };
}

function distanceKmFor(row: ProductWithSellerCoords, lat0: number, lng0: number): number {
  const { lat, lng } = resolveCoords(row);
  return Math.round(haversineDistanceKm(lat0, lng0, lat, lng) * 1000) / 1000;
}

function minMaxInvert(values: number[], v: number): number {
  if (values.length === 0) return 0.5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max <= min) return 0.5;
  const norm = (v - min) / (max - min);
  return 1 - norm;
}

function minMaxDirect(values: number[], v: number): number {
  if (values.length === 0) return 0.5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max <= min) return 0.5;
  return (v - min) / (max - min);
}

function logPopNorm(counts: number[], c: number): number {
  const logs = counts.map((n) => Math.log1p(n));
  const v = Math.log1p(c);
  return minMaxDirect(logs, v);
}

async function loadAggregates(productIds: string[]) {
  if (productIds.length === 0) {
    return {
      orderCount: new Map<string, number>(),
      ratingAvg: new Map<string, number>(),
    };
  }

  const [orderGroups, reviewGroups] = await Promise.all([
    prisma.order.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds }, status: "completed" },
      _count: { _all: true },
    }),
    prisma.productReview.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _avg: { stars: true },
      _count: { _all: true },
    }),
  ]);

  const orderCount = new Map<string, number>();
  for (const g of orderGroups) {
    orderCount.set(g.productId, g._count._all);
  }

  const ratingAvg = new Map<string, number>();
  for (const g of reviewGroups) {
    if (g._avg.stars != null) {
      ratingAvg.set(g.productId, g._avg.stars);
    }
  }

  return { orderCount, ratingAvg };
}

function scoreRow(
  row: ProductWithSellerCoords,
  ctx: {
    prices: number[];
    distances: number[];
    orderCounts: number[];
    lat0?: number;
    lng0?: number;
    orderCount: Map<string, number>;
    ratingAvg: Map<string, number>;
    sellerTrust: Map<string, number>;
  },
): Omit<RankedProductJson, "rankScore" | "rankComponents" | "sellerTrustScore"> & {
  rankComponents: RankComponents;
  preTrust: number;
} {
  const price = row.price.toNumber();
  const oc = ctx.orderCount.get(row.id) ?? 0;
  const avg = ctx.ratingAvg.get(row.id);
  const ratingComp = avg != null ? Math.min(1, Math.max(0, avg / 5)) : 0.55;

  let distKm = 0;
  let distComp = 0.5;
  if (ctx.lat0 != null && ctx.lng0 != null) {
    distKm = distanceKmFor(row, ctx.lat0, ctx.lng0);
    distComp = minMaxInvert(ctx.distances, distKm);
  }

  const priceComp = minMaxInvert(ctx.prices, price);
  const popComp = logPopNorm(ctx.orderCounts, oc);

  const sellerTrust = ctx.sellerTrust.get(row.sellerId) ?? 50;
  const trustNorm = sellerTrust / 100;

  const raw =
    W_PRICE * priceComp +
    W_DISTANCE * distComp +
    W_POPULARITY * popComp +
    W_RATING * ratingComp;

  const boosted = raw * (0.82 + 0.18 * trustNorm);

  const { locationSource } = resolveCoords(row);

  const base = toProductJson(row);
  return {
    ...base,
    distanceKm: ctx.lat0 != null && ctx.lng0 != null ? distKm : 0,
    locationSource,
    rankComponents: {
      price: Math.round(priceComp * 1000) / 1000,
      distance: Math.round(distComp * 1000) / 1000,
      popularity: Math.round(popComp * 1000) / 1000,
      rating: Math.round(ratingComp * 1000) / 1000,
    },
    preTrust: Math.round(boosted * 1000) / 1000,
  };
}

/**
 * Smart ranking: lower price & distance score higher; popularity & ratings score higher.
 * Seller trust nudges the final score (hybrid reputation).
 */
export async function listRankedProducts(input: {
  lat?: number;
  lng?: number;
  limit?: number;
  category?: string;
}): Promise<RankedProductJson[]> {
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));
  const fp = rankedQueryFingerprint({
    lat: input.lat,
    lng: input.lng,
    limit,
    category: input.category,
  });

  return cacheGetOrSetRanked(fp, async () => {
    const rows = await productRepo.findProductsForSearch(
      input.category ? { category: input.category } : {},
      RANK_FETCH_CAP,
    );

    if (rows.length === 0) return [];

    const productIds = rows.map((r) => r.id);
    const { orderCount, ratingAvg } = await loadAggregates(productIds);

    const prices = rows.map((r) => r.price.toNumber());
    let distances: number[] = [];
    if (input.lat != null && input.lng != null) {
      const la = input.lat;
      const ln = input.lng;
      distances = rows.map((r) => distanceKmFor(r, la, ln));
    }
    const orderCounts = rows.map((r) => orderCount.get(r.id) ?? 0);

    const sellerIds = [...new Set(rows.map((r) => r.sellerId))];
    const sellerTrust = new Map<string, number>();
    await Promise.all(
      sellerIds.map(async (sid) => {
        const t = await computeSellerTrust(sid);
        sellerTrust.set(sid, t.trustScore);
      }),
    );

    const ctx = {
      prices,
      distances,
      orderCounts,
      lat0: input.lat,
      lng0: input.lng,
      orderCount,
      ratingAvg,
      sellerTrust,
    };

    return rows
      .map((row) => {
        const partial = scoreRow(row, ctx);
        const { preTrust, rankComponents, ...rest } = partial;
        const sellerTrustScore = sellerTrust.get(row.sellerId) ?? 50;
        return {
          ...rest,
          rankComponents,
          rankScore: preTrust,
          sellerTrustScore,
        } as RankedProductJson;
      })
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, limit);
  });
}

/** Used by the assistant: rank already-fetched rows (same scoring, no extra DB for products). */
export async function rankProductRowsHybrid(
  rows: ProductWithSellerCoords[],
  lat?: number,
  lng?: number,
  limit = 20,
): Promise<RankedProductJson[]> {
  if (rows.length === 0) return [];
  const productIds = rows.map((r) => r.id);
  const { orderCount, ratingAvg } = await loadAggregates(productIds);
  const prices = rows.map((r) => r.price.toNumber());
  const distances =
    lat != null && lng != null ? rows.map((r) => distanceKmFor(r, lat, lng)) : [];
  const orderCounts = rows.map((r) => orderCount.get(r.id) ?? 0);

  const sellerIds = [...new Set(rows.map((r) => r.sellerId))];
  const sellerTrust = new Map<string, number>();
  await Promise.all(
    sellerIds.map(async (sid) => {
      const t = await computeSellerTrust(sid);
      sellerTrust.set(sid, t.trustScore);
    }),
  );

  const ctx = {
    prices,
    distances,
    orderCounts,
    lat0: lat,
    lng0: lng,
    orderCount,
    ratingAvg,
    sellerTrust,
  };

  return rows
    .map((row) => {
      const partial = scoreRow(row, ctx);
      const { preTrust, rankComponents, ...rest } = partial;
      const sellerTrustScore = sellerTrust.get(row.sellerId) ?? 50;
      return {
        ...rest,
        rankComponents,
        rankScore: preTrust,
        sellerTrustScore,
      } as RankedProductJson;
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, limit);
}
