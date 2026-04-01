"use client";

import { motion } from "framer-motion";
import { LayoutGrid, List, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { LandingAiChat } from "@/components/marketing/landing-ai-chat";
import { BuyerProductCard } from "@/components/shop/buyer-product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchProducts,
  fetchRankedProducts,
  searchProductsPublic,
  toastApiError,
  type ProductRow,
  type RankedProduct,
} from "@/lib/api";
import { SHOP_CITY_PRESETS } from "@/lib/shop-constants";

type SortKey = "createdAt_desc" | "price_asc" | "price_desc";
type DateFilter = "all" | "7d" | "30d";

function withinDays(createdAt: string, days: number) {
  const t = new Date(createdAt).getTime();
  const cut = Date.now() - days * 86400000;
  return t >= cut;
}

export function BuyerShopHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(() => searchParams.get("q") ?? "");
  const [featured, setFeatured] = useState<RankedProduct[]>([]);
  const [mainProducts, setMainProducts] = useState<ProductRow[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingMain, setLoadingMain] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");

  const qParam = searchParams.get("q")?.trim() ?? "";
  const categoryParam = searchParams.get("category") ?? "all";
  const cityId = searchParams.get("city") ?? "all";
  const sortParam = (searchParams.get("sort") as SortKey | null) ?? "createdAt_desc";
  const dateParam = (searchParams.get("added") as DateFilter | null) ?? "all";

  const city = useMemo(() => SHOP_CITY_PRESETS.find((c) => c.id === cityId) ?? SHOP_CITY_PRESETS[0]!, [cityId]);

  const syncUrl = useCallback(
    (patch: Record<string, string | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      }
      const qs = p.toString();
      router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    setSearchInput(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoadingFeatured(true);
      try {
        const { products } = await fetchRankedProducts({
          limit: 8,
          ...(city.lat != null && city.lng != null ? { lat: city.lat, lng: city.lng } : {}),
          ...(categoryParam !== "all" ? { category: categoryParam } : {}),
        });
        if (!c) setFeatured(products);
      } catch (e) {
        if (!c) toast.error(toastApiError(e));
      } finally {
        if (!c) setLoadingFeatured(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [city.lat, city.lng, categoryParam]);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoadingMain(true);
      try {
        let list: ProductRow[] = [];
        if (qParam.length > 0) {
          list = await searchProductsPublic({ q: qParam, limit: 48 });
        } else if (city.lat != null && city.lng != null) {
          const { products } = await fetchRankedProducts({
            lat: city.lat,
            lng: city.lng,
            limit: 48,
            ...(categoryParam !== "all" ? { category: categoryParam } : {}),
          });
          list = products;
        } else {
          const res = await fetchProducts({
            page: 1,
            limit: 48,
            sort: sortParam,
            ...(categoryParam !== "all" ? { category: categoryParam } : {}),
          });
          list = res.products;
        }
        if (!c) setMainProducts(list);
      } catch (e) {
        if (!c) toast.error(toastApiError(e));
      } finally {
        if (!c) setLoadingMain(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [qParam, city.lat, city.lng, categoryParam, sortParam]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const p of mainProducts) s.add(p.category);
    for (const p of featured) s.add(p.category);
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [mainProducts, featured]);

  const filteredMain = useMemo(() => {
    let list = mainProducts;
    if (dateParam === "7d") list = list.filter((p) => withinDays(p.createdAt, 7));
    if (dateParam === "30d") list = list.filter((p) => withinDays(p.createdAt, 30));
    return list;
  }, [mainProducts, dateParam]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    syncUrl({ q: searchInput.trim() || undefined });
  }

  return (
    <div className="space-y-10 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">EthioLocal</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Shop local favorites</h1>
        <p className="max-w-2xl text-muted-foreground">
          Browse by category and area, compare prices, then check out with M-Pesa. Your pickup QR appears after
          payment.
        </p>
      </motion.div>

      <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products…"
            className="h-11 rounded-2xl border-border/80 pl-10 shadow-sm"
            aria-label="Search products"
          />
        </div>
        <Button type="submit" className="h-11 rounded-2xl px-6 shadow-sm">
          Search
        </Button>
      </form>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Category</p>
            <Select
              value={!categoryParam || categoryParam === "all" ? "all" : categoryParam}
              onValueChange={(v) => syncUrl({ category: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All categories</SelectItem>
                {categoryParam !== "all" &&
                categoryParam &&
                !categories.includes(categoryParam) ? (
                  <SelectItem value={categoryParam}>{categoryParam}</SelectItem>
                ) : null}
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">City / area</p>
            <Select value={cityId} onValueChange={(v) => syncUrl({ city: v })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {SHOP_CITY_PRESETS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">New listings</p>
            <Select value={dateParam} onValueChange={(v) => syncUrl({ added: v })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Any time</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Sort</p>
            <Select
              value={sortParam}
              onValueChange={(v) => syncUrl({ sort: v })}
              disabled={qParam.length > 0 || (city.lat != null && city.lng != null)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="createdAt_desc">Newest</SelectItem>
                <SelectItem value="price_asc">Price · low to high</SelectItem>
                <SelectItem value="price_desc">Price · high to low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
          <Button
            type="button"
            size="sm"
            variant={view === "grid" ? "secondary" : "ghost"}
            className="rounded-lg"
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "list" ? "secondary" : "ghost"}
            className="rounded-lg"
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      <section aria-label="Assistant" className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-6">
        <LandingAiChat />
      </section>

      <section aria-label="Featured picks" className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-amber-500" />
          <h2 className="text-lg font-semibold tracking-tight">Featured & promoted</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ranked for value, trust, and distance{city.name !== "All areas" ? ` near ${city.name}` : ""}.
        </p>
        {loadingFeatured ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-sm text-muted-foreground">No featured listings yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 8).map((p) => (
              <BuyerProductCard
                key={p.id}
                product={p}
                variant={view}
                href={`/shop/product/${p.id}`}
                badge="Pick"
              />
            ))}
          </div>
        )}
      </section>

      <section aria-label="Browse products" className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <h2 className="text-lg font-semibold tracking-tight">Browse</h2>
          {qParam ? (
            <p className="text-sm text-muted-foreground">
              Results for “{qParam}” ·{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setSearchInput("");
                  syncUrl({ q: undefined });
                }}
              >
                Clear
              </button>
            </p>
          ) : null}
        </div>
        {loadingMain ? (
          <div
            className={
              view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3"
            }
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={view === "grid" ? "h-56 rounded-2xl" : "h-28 rounded-2xl"} />
            ))}
          </div>
        ) : filteredMain.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
            <p className="font-medium">Nothing matches</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try another category, city, or keyword — or{" "}
              <Link href="/shop" className="text-primary underline-offset-4 hover:underline">
                reset filters
              </Link>
              .
            </p>
          </div>
        ) : (
          <div
            className={
              view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3"
            }
          >
            {filteredMain.map((p) => (
              <BuyerProductCard key={p.id} product={p} variant={view} href={`/shop/product/${p.id}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
