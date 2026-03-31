import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import type { AssistantChatInput } from "../schemas/assistant.schemas.js";
import { haversineDistanceKm } from "../utils/haversine.js";
import type { ProductJson } from "./product.service.js";
import { toProductJson } from "./product.service.js";
import * as rankingService from "./ranking.service.js";
import type { RankComponents } from "./ranking.service.js";

/** Max products returned (after rule-based fetch + sort). */
const RESULT_LIMIT = 20;
/** Rows read from DB before sorting (cap work per chat). */
const FETCH_CAP = 200;

const CHEAP_PATTERNS = [
  "cheap",
  "affordable",
  "budget",
  "low price",
  "lowest",
  "inexpensive",
  "discount",
  "deal",
  "save money",
];

const NEARBY_PATTERNS = [
  "nearby",
  "near me",
  "close to me",
  "closest",
  "around me",
  "around here",
  "local",
  "distance",
];

/**
 * When the user asks for “best / recommended / trusted …”, run the same smart ranker as `GET /products/ranked`
 * (rules pick the candidate set; ranking scores price · distance · popularity · rating · trust).
 */
const SMART_RANK_PATTERNS = [
  "best",
  "top rated",
  "top-rated",
  "highest rated",
  "recommended",
  "recommend",
  "popular",
  "trending",
  "trusted",
  "trustworthy",
  "smart pick",
  "wow",
  "what should i buy",
  "which one",
];

export type AssistantIntents = {
  cheap: boolean;
  nearby: boolean;
  smartRanking: boolean;
  category: string | null;
};

export type AssistantProductJson = ProductJson & {
  distanceKm?: number;
  locationSource?: "seller" | "product";
  rankScore?: number;
  rankComponents?: RankComponents;
  sellerTrustScore?: number;
};

export type AssistantChatResult = {
  intents: AssistantIntents & {
    nearbyMissingCoordinates: boolean;
    smartRankingMissingCoordinates: boolean;
  };
  products: AssistantProductJson[];
  /** `hybrid_ranking` = rule-based fetch + smart score sort (your “hybrid AI” advantage). */
  assistantMode: "rules" | "hybrid_ranking";
};

function normalizeMessage(message: string): string {
  return message.toLowerCase().replace(/\s+/g, " ").trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Multi-word: substring match. Single-word: word boundary to avoid e.g. “deal” in “ideal”. */
function messageMatchesPhrase(haystackNorm: string, phrase: string): boolean {
  const p = phrase.trim().toLowerCase();
  if (!p) return false;
  if (p.includes(" ")) {
    return haystackNorm.includes(p);
  }
  return new RegExp(`\\b${escapeRegex(p)}\\b`).test(haystackNorm);
}

function hasAnyPhrase(haystackNorm: string, phrases: string[]): boolean {
  return phrases.some((p) => messageMatchesPhrase(haystackNorm, p));
}

async function loadCategoriesCanonical(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category);
}

/** Longest category name wins to avoid short substring false positives. */
function detectCategory(messageNorm: string, categories: string[]): string | null {
  const sorted = [...new Set(categories)].sort((a, b) => b.length - a.length);
  for (const c of sorted) {
    const key = c.toLowerCase().trim();
    if (key.length < 2) continue;
    if (messageNorm.includes(key)) return c;
  }
  return null;
}

export function parseIntents(message: string, categories: string[]): AssistantIntents {
  const n = normalizeMessage(message);
  return {
    cheap: hasAnyPhrase(n, CHEAP_PATTERNS),
    nearby: hasAnyPhrase(n, NEARBY_PATTERNS),
    smartRanking: hasAnyPhrase(n, SMART_RANK_PATTERNS),
    category: detectCategory(n, categories),
  };
}

type Row = Awaited<ReturnType<typeof fetchAssistantRows>>[number];

async function fetchAssistantRows(where: Prisma.ProductWhereInput) {
  return prisma.product.findMany({
    where,
    include: { seller: { select: { sellerLat: true, sellerLng: true } } },
    orderBy: { updatedAt: "desc" },
    take: FETCH_CAP,
  });
}

function rowToAssistantJson(row: Row, lat?: number, lng?: number): AssistantProductJson {
  const base = toProductJson(row);

  if (lat === undefined || lng === undefined) {
    return base;
  }

  const useSeller =
    row.seller.sellerLat != null &&
    row.seller.sellerLng != null &&
    !Number.isNaN(row.seller.sellerLat) &&
    !Number.isNaN(row.seller.sellerLng);
  const slat = useSeller ? row.seller.sellerLat! : row.lat;
  const slng = useSeller ? row.seller.sellerLng! : row.lng;
  const distanceKm = Math.round(haversineDistanceKm(lat, lng, slat, slng) * 1000) / 1000;
  return {
    ...base,
    distanceKm,
    locationSource: useSeller ? "seller" : "product",
  };
}

export async function runAssistantChat(input: AssistantChatInput): Promise<AssistantChatResult> {
  const categories = await loadCategoriesCanonical();
  const intents = parseIntents(input.message, categories);
  const nearbyMissingCoordinates =
    intents.nearby && (input.lat === undefined || input.lng === undefined);
  const smartRankingMissingCoordinates =
    intents.smartRanking && (input.lat === undefined || input.lng === undefined);

  const where: Prisma.ProductWhereInput =
    intents.category != null ? { category: intents.category } : {};

  const rows = await fetchAssistantRows(where);

  const canHybridRank =
    intents.smartRanking && input.lat !== undefined && input.lng !== undefined;

  if (canHybridRank) {
    const ranked = await rankingService.rankProductRowsHybrid(
      rows,
      input.lat,
      input.lng,
      RESULT_LIMIT,
    );
    return {
      intents: { ...intents, nearbyMissingCoordinates, smartRankingMissingCoordinates },
      products: ranked,
      assistantMode: "hybrid_ranking",
    };
  }

  const useGeo = intents.nearby && !nearbyMissingCoordinates;
  const geoLat = useGeo ? input.lat! : undefined;
  const geoLng = useGeo ? input.lng! : undefined;
  let items: AssistantProductJson[] = rows.map((r) => rowToAssistantJson(r, geoLat, geoLng));

  if (intents.nearby && !nearbyMissingCoordinates) {
    items.sort((a, b) => {
      const da = a.distanceKm ?? Infinity;
      const db = b.distanceKm ?? Infinity;
      if (da !== db) return da - db;
      if (intents.cheap) return a.price - b.price;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  } else if (intents.cheap) {
    items.sort((a, b) => {
      if (a.price !== b.price) return a.price - b.price;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }

  items = items.slice(0, RESULT_LIMIT);

  return {
    intents: { ...intents, nearbyMissingCoordinates, smartRankingMissingCoordinates },
    products: items,
    assistantMode: "rules",
  };
}
