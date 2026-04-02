"use client";

import { useEffect, useState } from "react";

import { MarketplaceProductCard } from "@/components/marketplace/marketplace-product-card";
import { MarketplaceProductShelf } from "@/components/marketplace/marketplace-product-shelf";
import { fetchProducts, type ProductRow } from "@/lib/api";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";

function mockRow(
  partial: Partial<ProductRow> & Pick<ProductRow, "id" | "title" | "price" | "category" | "sellerId">,
): ProductRow {
  return {
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
  };
}

const MOCK: ProductRow[] = [
  mockRow({ id: "m1", title: "Teff flour · premium", price: 890, category: "Grains", sellerId: "s1" }),
  mockRow({ id: "m2", title: "Roasted coffee · 500g", price: 450, category: "Beverages", sellerId: "s2" }),
  mockRow({ id: "m3", title: "Local honey · jar", price: 620, category: "Pantry", sellerId: "s3" }),
  mockRow({ id: "m4", title: "Fresh injera pack", price: 180, category: "Bakery", sellerId: "s4" }),
  mockRow({ id: "m5", title: "Berbere spice blend", price: 320, category: "Spices", sellerId: "s5" }),
  mockRow({ id: "m6", title: "Seasonal vegetables bundle", price: 240, category: "Produce", sellerId: "s6" }),
];

function formatLocation(p: ProductRow, fallback: string) {
  const { lat, lng } = p.location;
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  }
  return fallback;
}

export function LandingTrending() {
  const { messages } = useLandingI18n();
  const m = messages.marketplace;
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSamplesNote, setShowSamplesNote] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const d = await fetchProducts({ limit: 12, page: 1 });
        if (c) return;
        if (d.products.length > 0) {
          setRows(d.products);
          setShowSamplesNote(false);
        } else {
          setRows(MOCK);
          setShowSamplesNote(true);
        }
      } catch {
        if (!c) {
          setRows(MOCK);
          setShowSamplesNote(true);
        }
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const display = loading ? [] : rows;

  return (
    <div className="border-y border-zinc-200/90 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <MarketplaceProductShelf
        id="trending"
        eyebrow={messages.trending.eyebrow}
        title={messages.trending.title}
        subtitle={messages.trending.subtitle}
        footnote={showSamplesNote && !loading ? messages.trending.samplesNote : null}
        seeAllHref="/shop"
        seeAllLabel={m.shelfSeeAll}
        className="!py-14 md:!py-16"
      >
        {loading ? (
          <p className="w-full py-8 text-center text-sm text-zinc-500">{messages.trending.loading}</p>
        ) : display.length === 0 ? (
          <p className="w-full py-8 text-center text-sm text-zinc-500">{messages.trending.empty}</p>
        ) : (
          display.map((p) => (
            <div key={p.id} className="w-[min(46vw,200px)] shrink-0 snap-start sm:w-[200px]">
              <MarketplaceProductCard product={p} meta={formatLocation(p, messages.trending.locationFallback)} className="h-full" />
            </div>
          ))
        )}
      </MarketplaceProductShelf>
    </div>
  );
}
