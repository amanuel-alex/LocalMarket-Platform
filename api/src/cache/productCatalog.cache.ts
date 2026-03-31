import type { NearbyProductsQuery } from "../schemas/location.schemas.js";
import type { NearbyProductJson, ProductJson } from "../services/product.service.js";
import { getRedis } from "./redisClient.js";

const EPOCH_KEY = "productcat:epoch";

const TTL_LIST_SEC = 120;
const TTL_BY_ID_SEC = 300;
const TTL_NEARBY_SEC = 60;
const TTL_RELATED_SEC = 180;

function keyParts(epoch: string, suffix: string): string {
  return `productcat:${epoch}:${suffix}`;
}

async function readEpoch(): Promise<string> {
  const r = getRedis();
  if (!r) return "0";
  try {
    const v = await r.get(EPOCH_KEY);
    return v ?? "0";
  } catch {
    return "0";
  }
}

/** Bump after product writes so all read keys rotate without SCAN. */
export async function bumpProductCatalogCacheEpoch(): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.incr(EPOCH_KEY);
  } catch {
    /* ignore */
  }
}

function reviveProductJson(raw: ProductJson): ProductJson {
  return {
    ...raw,
    createdAt: new Date(raw.createdAt as unknown as string),
    updatedAt: new Date(raw.updatedAt as unknown as string),
  };
}

function reviveNearby(raw: NearbyProductJson): NearbyProductJson {
  const base = reviveProductJson(raw);
  return { ...base, distanceKm: raw.distanceKm, locationSource: raw.locationSource };
}

export async function cacheGetOrSetProductList(loader: () => Promise<ProductJson[]>): Promise<ProductJson[]> {
  const epoch = await readEpoch();
  const key = keyParts(epoch, "list");
  const r = getRedis();
  if (r) {
    try {
      const hit = await r.get(key);
      if (hit) {
        const parsed = JSON.parse(hit) as ProductJson[];
        return parsed.map(reviveProductJson);
      }
    } catch {
      /* fall through */
    }
  }

  const fresh = await loader();
  if (r) {
    try {
      await r.set(key, JSON.stringify(fresh), "EX", TTL_LIST_SEC);
    } catch {
      /* ignore */
    }
  }
  return fresh;
}

export async function cacheGetOrSetProductById(
  id: string,
  loader: () => Promise<ProductJson | null>,
): Promise<ProductJson | null> {
  const epoch = await readEpoch();
  const key = keyParts(epoch, `id:${id}`);
  const r = getRedis();
  if (r) {
    try {
      const hit = await r.get(key);
      if (hit) {
        return reviveProductJson(JSON.parse(hit) as ProductJson);
      }
    } catch {
      /* fall through */
    }
  }

  const fresh = await loader();
  if (fresh && r) {
    try {
      await r.set(key, JSON.stringify(fresh), "EX", TTL_BY_ID_SEC);
    } catch {
      /* ignore */
    }
  }
  return fresh;
}

function nearbyQueryHash(q: NearbyProductsQuery): string {
  const r = q.radiusKm != null ? q.radiusKm.toFixed(2) : "all";
  return `${q.lat.toFixed(5)}:${q.lng.toFixed(5)}:${r}:${q.limit}`;
}

export async function cacheGetOrSetNearby(
  query: NearbyProductsQuery,
  loader: () => Promise<NearbyProductJson[]>,
): Promise<NearbyProductJson[]> {
  const epoch = await readEpoch();
  const key = keyParts(epoch, `nearby:${nearbyQueryHash(query)}`);
  const r = getRedis();
  if (r) {
    try {
      const hit = await r.get(key);
      if (hit) {
        const parsed = JSON.parse(hit) as NearbyProductJson[];
        return parsed.map(reviveNearby);
      }
    } catch {
      /* fall through */
    }
  }

  const fresh = await loader();
  if (r) {
    try {
      await r.set(key, JSON.stringify(fresh), "EX", TTL_NEARBY_SEC);
    } catch {
      /* ignore */
    }
  }
  return fresh;
}

export async function cacheGetOrSetRelated(
  anchorProductId: string,
  loader: () => Promise<ProductJson[]>,
): Promise<ProductJson[]> {
  const epoch = await readEpoch();
  const key = keyParts(epoch, `related:${anchorProductId}`);
  const r = getRedis();
  if (r) {
    try {
      const hit = await r.get(key);
      if (hit) {
        const parsed = JSON.parse(hit) as ProductJson[];
        return parsed.map(reviveProductJson);
      }
    } catch {
      /* fall through */
    }
  }

  const fresh = await loader();
  if (r) {
    try {
      await r.set(key, JSON.stringify(fresh), "EX", TTL_RELATED_SEC);
    } catch {
      /* ignore */
    }
  }
  return fresh;
}
