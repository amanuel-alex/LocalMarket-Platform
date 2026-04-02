"use client";

import Link from "next/link";
import { MapPin, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { MarketplaceProductCard } from "@/components/marketplace/marketplace-product-card";
import { MarketplaceProductShelf } from "@/components/marketplace/marketplace-product-shelf";
import { Button } from "@/components/ui/button";
import { fetchRankedProducts, type RankedProduct } from "@/lib/api";
import { useViewerLocation } from "@/hooks/use-viewer-location";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";

export function LandingShopLocalSection() {
  const { messages } = useLandingI18n();
  const m = messages.marketplace;
  const { lat, lng, label, status, request } = useViewerLocation({ auto: true });
  const [products, setProducts] = useState<RankedProduct[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (lat == null || lng == null) return;
    let c = false;
    (async () => {
      setLoadingList(true);
      try {
        const { products: list } = await fetchRankedProducts({ lat, lng, limit: 12 });
        if (!c) setProducts(list);
      } catch {
        if (!c) setProducts([]);
      } finally {
        if (!c) setLoadingList(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [lat, lng]);

  if (status === "denied") {
    return (
      <section id="shop-local" className="scroll-mt-24 bg-zinc-100 py-12 dark:bg-zinc-900/80 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 md:text-2xl">{m.shopLocalTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{m.shopLocalDenied}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={() => request()} className="rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400">
              <RefreshCw className="mr-2 size-4" aria-hidden />
              {m.shopLocalRetry}
            </Button>
            <Button type="button" variant="outline" asChild className="rounded-lg">
              <Link href="/shop">{m.shopLocalBrowseShop}</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (status === "unavailable") {
    return (
      <section id="shop-local" className="scroll-mt-24 bg-zinc-100 py-12 dark:bg-zinc-900/80 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 md:text-2xl">{m.shopLocalTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{m.shopLocalUnavailable}</p>
          <Button type="button" asChild className="mt-6 rounded-lg">
            <Link href="/shop">{m.shopLocalBrowseShop}</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (status === "loading" || loadingList) {
    return (
      <section id="shop-local" className="scroll-mt-24 bg-zinc-100 py-12 dark:bg-zinc-900/80 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-500">{m.shopLocalLoading}</p>
        </div>
      </section>
    );
  }

  if (status === "ready" && products.length === 0) {
    return (
      <section id="shop-local" className="scroll-mt-24 bg-zinc-100 py-12 dark:bg-zinc-900/80 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 md:text-2xl">{m.shopLocalTitle}</h2>
          {label ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              <MapPin className="size-4 text-amber-600" aria-hidden />
              <span>
                {m.shopLocalNear} {label}
              </span>
            </p>
          ) : null}
          <p className="mt-4 text-sm text-zinc-500">{m.shopLocalEmpty}</p>
          <Button type="button" asChild className="mt-4 rounded-lg">
            <Link href="/shop">{m.shopLocalBrowseShop}</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-zinc-100 dark:bg-zinc-900/80">
      <MarketplaceProductShelf
        id="shop-local"
        title={m.shopLocalTitle}
        subtitle={
          label
            ? `${m.shopLocalNear} ${label} — ${m.shopLocalSubtitle}`
            : m.shopLocalSubtitle
        }
        viewAllHref="/shop"
        viewAllLabel={m.shopLocalSeeAll}
      >
        {products.map((p) => (
          <div key={p.id} className="shrink-0">
            <MarketplaceProductCard product={p} href={`/shop/product/${p.id}`} badge="Local" />
          </div>
        ))}
      </MarketplaceProductShelf>
    </div>
  );
}
