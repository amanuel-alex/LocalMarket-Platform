"use client";

import Link from "next/link";
import { Grid3X3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { fetchProducts } from "@/lib/api";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";
import { cn } from "@/lib/utils";

const FALLBACK = ["Grains", "Beverages", "Pantry", "Bakery", "Spices", "Produce", "Dairy", "Household"];

const ACCENTS = [
  "from-amber-500/90 to-orange-600/85",
  "from-violet-500/85 to-indigo-600/80",
  "from-emerald-500/85 to-teal-600/80",
  "from-rose-500/80 to-pink-600/75",
  "from-sky-500/85 to-blue-600/80",
  "from-fuchsia-500/80 to-purple-600/75",
];

export function LandingCategoriesSection() {
  const { messages } = useLandingI18n();
  const m = messages.marketplace;
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const d = await fetchProducts({ limit: 120, page: 1 });
        if (c) return;
        const set = new Set<string>();
        for (const p of d.products) {
          if (p.category?.trim()) set.add(p.category.trim());
        }
        const list = Array.from(set);
        setCategories(list.length > 0 ? list.slice(0, 12) : FALLBACK);
      } catch {
        if (!c) setCategories(FALLBACK);
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const tiles = useMemo(() => categories.map((name, i) => ({ name, accent: ACCENTS[i % ACCENTS.length] })), [categories]);

  return (
    <section id="categories" className="scroll-mt-28 border-y border-zinc-200/90 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950 md:scroll-mt-32 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">{m.categoriesEyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{m.categoriesTitle}</h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">{m.categoriesSubtitle}</p>
          </div>
          <Link
            href="/shop"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400 sm:mt-0"
          >
            {m.categoriesSeeAll}
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        ) : (
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {tiles.map(({ name, accent }) => (
              <li key={name}>
                <Link
                  href={`/shop?category=${encodeURIComponent(name)}`}
                  className={cn(
                    "flex h-full min-h-[104px] flex-col justify-end rounded-xl bg-gradient-to-br p-4 text-white shadow-md transition hover:scale-[1.02] hover:shadow-lg",
                    accent,
                  )}
                >
                  <Grid3X3 className="mb-2 size-5 opacity-90" aria-hidden />
                  <span className="text-sm font-semibold leading-tight">{name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
