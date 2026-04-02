"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type MarketplaceProductShelfProps = {
  id?: string;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  /** Small muted note under subtitle (e.g. sample data disclaimer) */
  footnote?: string | null;
  seeAllHref?: string;
  seeAllLabel: string;
  className?: string;
  children: ReactNode;
};

export function MarketplaceProductShelf({
  id,
  eyebrow,
  title,
  subtitle,
  footnote,
  seeAllHref,
  seeAllLabel,
  className,
  children,
}: MarketplaceProductShelfProps) {
  return (
    <section id={id} className={cn("scroll-mt-28 py-10 md:scroll-mt-32 md:py-12", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">{eyebrow}</p>
            ) : null}
            <h2
              className={cn(
                "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-2xl",
                eyebrow ? "mt-2" : "",
              )}
            >
              {title}
            </h2>
            {subtitle ? <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p> : null}
            {footnote ? (
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">{footnote}</p>
            ) : null}
          </div>
          {seeAllHref ? (
            <Link
              href={seeAllHref}
              className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
            >
              {seeAllLabel}
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-950" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-zinc-50 to-transparent dark:from-zinc-950" />
          <div
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1 sm:mx-0 sm:gap-4 sm:px-0"
            style={{ scrollbarWidth: "thin" }}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
