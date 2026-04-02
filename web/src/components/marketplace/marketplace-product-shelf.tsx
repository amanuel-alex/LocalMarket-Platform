"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function MarketplaceProductShelf({
  id,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  announcement,
  children,
  className,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  viewAllHref: string;
  viewAllLabel: string;
  announcement?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-10 md:py-14", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {announcement ? <div className="mb-4">{announcement}</div> : null}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-2xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
            ) : null}
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
          >
            {viewAllLabel}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 pt-1 scrollbar-thin sm:mx-0 sm:px-0 md:gap-4">
          {children}
        </div>
      </div>
    </section>
  );
}
