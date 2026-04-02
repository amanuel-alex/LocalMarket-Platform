"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { fetchProducts } from "@/lib/api";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";
import { cn } from "@/lib/utils";

export function LandingCategoriesSection() {
  const { messages } = useLandingI18n();
  const m = messages.marketplace;
  const [loading, setLoading] = useState(true);
  const [pairs, setPairs] = useState<Array<{ name: string; count: number }>>([]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const { products } = await fetchProducts({ page: 1, limit: 150 });
        if (c) return;
        const map = new Map<string, number>();
        for (const p of products) {
          const cat = p.category?.trim() || "Other";
          map.set(cat, (map.get(cat) ?? 0) + 1);
        }
        const list = [...map.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
          .slice(0, 18);
        setPairs(list);
      } catch {
        if (!c) setPairs([]);
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const icons = useMemo(
    () => ["🌾", "☕", "🍯", "🥖", "🌶️", "🥬", "🧴", "🫘", "🍎", "🥛", "🧂", "🍵"],
    [],
  );

  return (
    <section id="categories" className="scroll-mt-24 bg-white py-12 dark:bg-zinc-950 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-2xl">
              {m.categoriesTitle}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{m.categoriesSubtitle}</p>
          </div>
          <Link
            href="/shop"
            className="text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
          >
            {m.categoriesSeeAll} →
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">{m.categoriesLoading}</p>
        ) : pairs.length === 0 ? (
          <p className="text-sm text-zinc-500">{m.categoriesEmpty}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {pairs.map((item, i) => (
              <li key={item.name}>
                <Link
                  href={`/shop?category=${encodeURIComponent(item.name)}`}
                  className={cn(
                    "flex flex-col rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-4 transition-colors",
                    "hover:border-amber-300/80 hover:bg-amber-50/50 dark:border-zinc-800 dark:bg-zinc-900/60",
                    "dark:hover:border-amber-700/40 dark:hover:bg-amber-950/20",
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {icons[i % icons.length]}
                  </span>
                  <span className="mt-2 line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.name}
                  </span>
                  <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.count} {m.categoriesListings}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
