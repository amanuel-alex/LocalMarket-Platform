"use client";

import { useEffect, useState } from "react";

import { MarketplaceProductCard } from "@/components/marketplace/marketplace-product-card";
import { MarketplaceProductShelf } from "@/components/marketplace/marketplace-product-shelf";
import { fetchRankedProducts, type RankedProduct } from "@/lib/api";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";

const MOCK: RankedProduct[] = [
  {
    id: "m1",
    title: "Teff flour · premium",
    description: "",
    price: 890,
    quantity: 20,
    sold: 2,
    isSoldOut: false,
    availableStock: 18,
    category: "Grains",
    location: { lat: 9.03, lng: 38.75 },
    imageUrl: null,
    productGroupId: null,
    sellerId: "s1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rankScore: 0.9,
    distanceKm: 2.4,
    locationSource: "mock",
    sellerTrustScore: 4.6,
  },
  {
    id: "m2",
    title: "Roasted coffee · 500g",
    description: "",
    price: 450,
    quantity: 30,
    sold: 5,
    isSoldOut: false,
    availableStock: 25,
    category: "Beverages",
    location: { lat: 9.02, lng: 38.74 },
    imageUrl: null,
    productGroupId: null,
    sellerId: "s2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rankScore: 0.88,
    distanceKm: 3.1,
    locationSource: "mock",
    sellerTrustScore: 4.4,
  },
  {
    id: "m3",
    title: "Local honey · jar",
    description: "",
    price: 620,
    quantity: 15,
    sold: 1,
    isSoldOut: false,
    availableStock: 14,
    category: "Pantry",
    location: { lat: 9.04, lng: 38.76 },
    imageUrl: null,
    productGroupId: null,
    sellerId: "s3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rankScore: 0.85,
    distanceKm: 4.0,
    locationSource: "mock",
    sellerTrustScore: 4.7,
  },
  {
    id: "m4",
    title: "Fresh injera pack",
    description: "",
    price: 180,
    quantity: 40,
    sold: 12,
    isSoldOut: false,
    availableStock: 28,
    category: "Bakery",
    location: { lat: 9.01, lng: 38.73 },
    imageUrl: null,
    productGroupId: null,
    sellerId: "s4",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rankScore: 0.82,
    distanceKm: 5.2,
    locationSource: "mock",
    sellerTrustScore: 4.2,
  },
  {
    id: "m5",
    title: "Berbere spice blend",
    description: "",
    price: 320,
    quantity: 25,
    sold: 3,
    isSoldOut: false,
    availableStock: 22,
    category: "Spices",
    location: { lat: 9.05, lng: 38.77 },
    imageUrl: null,
    productGroupId: null,
    sellerId: "s5",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rankScore: 0.8,
    distanceKm: 6.0,
    locationSource: "mock",
    sellerTrustScore: 4.5,
  },
];

export function LandingTrending() {
  const { messages } = useLandingI18n();
  const m = messages.marketplace;
  const t = messages.trending;
  const [rows, setRows] = useState<RankedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSamplesNote, setShowSamplesNote] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const { products } = await fetchRankedProducts({ limit: 12 });
        if (c) return;
        if (products.length > 0) {
          setRows(products);
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

  if (loading) {
    return (
      <section id="trending" className="scroll-mt-24 border-y border-zinc-200/80 bg-zinc-50 py-14 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-zinc-500">{t.loading}</p>
        </div>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section id="trending" className="scroll-mt-24 border-y border-zinc-200/80 bg-zinc-50 py-14 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-zinc-500">{t.empty}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="border-y border-zinc-200/80 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <MarketplaceProductShelf
        id="trending"
        title={t.title}
        subtitle={t.subtitle}
        viewAllHref="/shop"
        viewAllLabel={m.trendingSeeAll}
        announcement={
          showSamplesNote ? (
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">{t.samplesNote}</p>
          ) : undefined
        }
      >
        {rows.map((p) => (
          <div key={p.id} className="shrink-0">
            <MarketplaceProductCard product={p} href={`/shop/product/${p.id}`} badge="Trending" />
          </div>
        ))}
      </MarketplaceProductShelf>
    </div>
  );
}
