"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchProducts, type ProductRow } from "@/lib/api";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";
import { cn } from "@/lib/utils";

const MOCK: ProductRow[] = [
  {
    id: "m1",
    title: "Teff flour · premium",
    description: "",
    price: 890,
    category: "Grains",
    location: { lat: 9.03, lng: 38.75 },
    imageUrl: null,
    productGroupId: null,
    sellerId: "s1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "m2",
    title: "Roasted coffee · 500g",
    description: "",
    price: 450,
    category: "Beverages",
    location: { lat: 9.02, lng: 38.74 },
    imageUrl: null,
    productGroupId: null,
    sellerId: "s2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "m3",
    title: "Local honey · jar",
    description: "",
    price: 620,
    category: "Pantry",
    location: { lat: 9.04, lng: 38.76 },
    imageUrl: null,
    productGroupId: null,
    sellerId: "s3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "m4",
    title: "Fresh injera pack",
    description: "",
    price: 180,
    category: "Bakery",
    location: { lat: 9.01, lng: 38.73 },
    imageUrl: null,
    productGroupId: null,
    sellerId: "s4",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "m5",
    title: "Berbere spice blend",
    description: "",
    price: 320,
    category: "Spices",
    location: { lat: 9.05, lng: 38.77 },
    imageUrl: null,
    productGroupId: null,
    sellerId: "s5",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function formatLocation(p: ProductRow, fallback: string) {
  const { lat, lng } = p.location;
  if (lat && lng) return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  return fallback;
}

export function LandingTrending() {
  const { messages } = useLandingI18n();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedMock, setUsedMock] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const d = await fetchProducts({ limit: 12, page: 1 });
        if (c) return;
        if (d.products.length > 0) {
          setRows(d.products);
          setUsedMock(false);
        } else {
          setRows(MOCK);
          setUsedMock(true);
        }
      } catch {
        if (!c) {
          setRows(MOCK);
          setUsedMock(true);
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
    <section id="trending" className="scroll-mt-24 border-y border-zinc-200/80 py-20 dark:border-zinc-800 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            {messages.trending.eyebrow}
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl">
            {messages.trending.title}
          </h2>
          <p className="mt-4 text-pretty text-lg text-zinc-600 dark:text-zinc-400">
            {messages.trending.subtitle}
            {usedMock && !loading ? (
              <span className="mt-2 block text-sm text-amber-700 dark:text-amber-400">
                {messages.trending.error}
              </span>
            ) : null}
          </p>
        </div>

        {loading ? (
          <p className="mt-12 text-center text-sm text-zinc-500">{messages.trending.loading}</p>
        ) : display.length === 0 ? (
          <p className="mt-12 text-center text-sm text-zinc-500">{messages.trending.empty}</p>
        ) : (
          <div className="relative mt-12">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-950" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-zinc-50 to-transparent dark:from-zinc-950" />
            <div
              className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-2 scrollbar-thin sm:mx-0 sm:px-1"
              style={{ scrollbarWidth: "thin" }}
            >
              {display.map((p, i) => (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 22 } }}
                  className={cn(
                    "w-[min(85vw,280px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-md",
                    "dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-zinc-950/50",
                  )}
                >
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-violet-100 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/40">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-4xl font-semibold text-violet-300/80 dark:text-violet-700/50">
                        {p.title.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                      {p.title}
                    </h3>
                    <p className="text-lg font-bold tracking-tight text-violet-700 dark:text-violet-400">
                      ETB {p.price.toLocaleString()}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <MapPin className="size-3.5 shrink-0 text-violet-500" />
                      {formatLocation(p, messages.trending.locationFallback)}
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
