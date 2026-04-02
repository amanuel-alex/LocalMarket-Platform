"use client";

import { MapPin, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { MarketplaceProductCard } from "@/components/marketplace/marketplace-product-card";
import { MarketplaceProductShelf } from "@/components/marketplace/marketplace-product-shelf";
import { Button } from "@/components/ui/button";
import { fetchProducts, fetchRankedProducts, type ProductRow, type RankedProduct } from "@/lib/api";
import { useViewerLocation } from "@/hooks/use-viewer-location";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";

function buildMockRows(): ProductRow[] {
  const base = (partial: Partial<ProductRow> & Pick<ProductRow, "id" | "title" | "price" | "category" | "sellerId">): ProductRow => ({
    description: "",
    quantity: 10,
    sold: 0,
    isSoldOut: false,
    availableStock: 10,
    imageUrl: null,
    productGroupId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    location: { lat: 9.03, lng: 38.75 },
    ...partial,
  });

  return [
    base({ id: "m1", title: "Teff flour · premium", price: 890, category: "Grains", sellerId: "s1" }),
    base({ id: "m2", title: "Roasted coffee · 500g", price: 450, category: "Beverages", sellerId: "s2" }),
    base({ id: "m3", title: "Local honey · jar", price: 620, category: "Pantry", sellerId: "s3" }),
    base({ id: "m4", title: "Fresh injera pack", price: 180, category: "Bakery", sellerId: "s4" }),
    base({ id: "m5", title: "Berbere spice blend", price: 320, category: "Spices", sellerId: "s5" }),
    base({ id: "m6", title: "Seasonal vegetables bundle", price: 240, category: "Produce", sellerId: "s6" }),
  ];
}

export function LandingShopLocalSection() {
  const { messages } = useLandingI18n();
  const m = messages.marketplace;
  const { status, lat, lng, placeLabel, refresh } = useViewerLocation();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [rankedMeta, setRankedMeta] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [usedMock, setUsedMock] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (status === "loading" || status === "idle") {
      setLoading(true);
      return () => {
        cancelled = true;
      };
    }

    async function load() {
      setLoading(true);
      setUsedMock(false);

      if (lat != null && lng != null && status === "ready") {
        try {
          const { products } = await fetchRankedProducts({ lat, lng, limit: 12 });
          if (cancelled) return;
          if (products.length > 0) {
            const meta = new Map<string, string>();
            for (const p of products as RankedProduct[]) {
              if (typeof p.distanceKm === "number" && Number.isFinite(p.distanceKm)) {
                meta.set(p.id, m.distanceKmAway.replace("{n}", p.distanceKm.toFixed(1)));
              }
            }
            setRankedMeta(meta);
            setRows(products);
            return;
          }
        } catch {
          /* fall through */
        }
      }

      try {
        const d = await fetchProducts({ limit: 12, page: 1 });
        if (cancelled) return;
        if (d.products.length > 0) {
          setRankedMeta(new Map());
          setRows(d.products);
          return;
        }
      } catch {
        /* fall through */
      }

      if (!cancelled) {
        setRankedMeta(new Map());
        setRows(buildMockRows());
        setUsedMock(true);
      }
    }

    void load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [status, lat, lng, m.distanceKmAway]);

  const subtitleParts: string[] = [];
  if (placeLabel) subtitleParts.push(placeLabel);
  if (status === "denied") subtitleParts.push(m.shopLocalDenied);
  if (status === "unavailable" || status === "error") subtitleParts.push(m.shopLocalFallback);
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(" · ") : messages.marketplace.shopLocalSubtitle;

  return (
    <div id="shop-local" className="scroll-mt-28 bg-zinc-50 dark:bg-zinc-950 md:scroll-mt-32">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200">
              <MapPin className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{m.shopLocalLocationLabel}</p>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                {status === "loading"
                  ? m.shopLocalLoading
                  : placeLabel ??
                    (lat != null && lng != null
                      ? `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`
                      : m.shopLocalNoLocation)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {status === "denied" || status === "error" || status === "unavailable" ? (
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => refresh()}>
                <RefreshCw className="mr-1.5 size-3.5" />
                {m.shopLocalRetry}
              </Button>
            ) : null}
            <Button type="button" variant="secondary" size="sm" className="rounded-lg" asChild>
              <a href="/shop">{m.shopLocalSeeAll}</a>
            </Button>
          </div>
        </div>
      </div>

      <MarketplaceProductShelf
        title={m.shopLocalTitle}
        subtitle={usedMock && !loading ? `${subtitle} · ${messages.trending.samplesNote}` : subtitle}
        seeAllHref="/shop"
        seeAllLabel={m.shelfSeeAll}
      >
        {loading ? (
          <p className="w-full py-8 text-center text-sm text-zinc-500">{m.shopLocalLoadingProducts}</p>
        ) : rows.length === 0 ? (
          <p className="w-full py-8 text-center text-sm text-zinc-500">{m.shopLocalEmpty}</p>
        ) : (
          rows.map((p) => (
            <div key={p.id} className="w-[min(46vw,200px)] shrink-0 snap-start sm:w-[200px]">
              <MarketplaceProductCard
                product={p}
                meta={rankedMeta.get(p.id) ?? null}
                badge={m.localBadge}
                className="h-full"
              />
            </div>
          ))
        )}
      </MarketplaceProductShelf>
    </div>
  );
}
