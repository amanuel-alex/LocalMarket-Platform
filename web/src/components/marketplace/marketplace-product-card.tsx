"use client";

import Link from "next/link";

import type { ProductRow } from "@/lib/api";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";
import { cn } from "@/lib/utils";

export type MarketplaceProductCardProps = {
  product: ProductRow;
  href?: string;
  /** Secondary line (e.g. distance or area) */
  meta?: string | null;
  badge?: string | null;
  className?: string;
};

export function MarketplaceProductCard({ product, href, meta, badge, className }: MarketplaceProductCardProps) {
  const { messages } = useLandingI18n();
  const to = href ?? `/shop/product/${product.id}`;
  const outOfStock = product.isSoldOut || product.availableStock <= 0;

  return (
    <Link
      href={to}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200/95 bg-white shadow-sm transition-all duration-200",
        "hover:border-amber-400/80 hover:shadow-md hover:shadow-zinc-900/8",
        "dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-amber-500/50 dark:hover:shadow-black/40",
        outOfStock && "opacity-90",
        className,
      )}
    >
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900">
        {badge ? (
          <span className="absolute left-2 top-2 z-10 rounded bg-zinc-900/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300 dark:bg-amber-500/95 dark:text-zinc-950">
            {badge}
          </span>
        ) : null}
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-5xl font-semibold text-zinc-300 dark:from-zinc-800 dark:to-zinc-900 dark:text-zinc-600">
            {product.title.slice(0, 1).toUpperCase()}
          </div>
        )}
        {outOfStock ? (
          <span className="absolute bottom-2 left-2 rounded bg-zinc-900/85 px-2 py-0.5 text-[10px] font-semibold text-white">
            {messages.marketplace.outOfStock}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-100">
          {product.title}
        </h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">ETB </span>
            {product.price.toLocaleString()}
          </span>
          {product.category ? (
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{product.category}</span>
          ) : null}
        </div>
        {meta ? <p className="text-xs text-zinc-500 line-clamp-1 dark:text-zinc-400">{meta}</p> : null}
      </div>
    </Link>
  );
}
