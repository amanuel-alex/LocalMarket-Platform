"use client";

import { MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { ProductRow, RankedProduct } from "@/lib/api";
import { cn } from "@/lib/utils";

function isRanked(p: ProductRow | RankedProduct): p is RankedProduct {
  return typeof (p as RankedProduct).distanceKm === "number";
}

export function MarketplaceProductCard({
  product,
  href,
  badge,
  className,
}: {
  product: ProductRow | RankedProduct;
  href: string;
  badge?: string;
  className?: string;
}) {
  const distance = isRanked(product) ? product.distanceKm : null;
  const trust = isRanked(product) ? product.sellerTrustScore : null;

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full min-w-[160px] max-w-[220px] flex-col overflow-hidden rounded-lg border border-zinc-200/90 bg-white shadow-sm transition-[box-shadow,transform,border-color] duration-200",
        "hover:-translate-y-0.5 hover:border-amber-200/90 hover:shadow-md",
        "dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-amber-700/50",
        className,
      )}
    >
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
        {badge ? (
          <span className="absolute left-2 top-2 z-[1] rounded-sm bg-zinc-900/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
            {badge}
          </span>
        ) : null}
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="220px"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-4xl font-semibold text-zinc-400 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-600">
            {product.title.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
          {product.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {trust != null && trust > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-amber-400">
              <Star className="size-3.5 fill-amber-400 text-amber-500" aria-hidden />
              {trust.toFixed(1)}
            </span>
          ) : null}
          <span className="line-clamp-1">{product.category}</span>
        </div>
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">ETB </span>
          {product.price.toLocaleString()}
        </p>
        {distance != null ? (
          <p className="mt-auto inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <MapPin className="size-3 shrink-0 text-amber-600/80 dark:text-amber-500/80" aria-hidden />
            {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
          </p>
        ) : (
          <p className="mt-auto inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <MapPin className="size-3 shrink-0 text-zinc-400" aria-hidden />
            {product.location.lat.toFixed(2)}°, {product.location.lng.toFixed(2)}°
          </p>
        )}
      </div>
    </Link>
  );
}
