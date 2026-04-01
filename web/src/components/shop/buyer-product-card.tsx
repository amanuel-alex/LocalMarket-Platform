"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProductRow } from "@/lib/api";

function locationLabel(p: ProductRow) {
  return `${p.location.lat.toFixed(2)}°, ${p.location.lng.toFixed(2)}°`;
}

export function BuyerProductCard({
  product: p,
  variant = "grid",
  href,
  badge,
}: {
  product: ProductRow;
  variant?: "grid" | "list";
  href: string;
  badge?: string;
}) {
  if (variant === "list") {
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
        <Link href={href} className="block">
          <Card
            className={cn(
              "overflow-hidden rounded-2xl border-border/60 shadow-sm transition-all hover:border-violet-200/80 hover:shadow-md",
            )}
          >
            <div className="flex gap-4 p-3 sm:p-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="112px"
                    unoptimized
                  />
                ) : null}
              </div>
              <CardContent className="flex flex-1 flex-col justify-center space-y-1 p-0">
                <div className="flex flex-wrap items-center gap-2">
                  {badge ? (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                      {badge}
                    </span>
                  ) : null}
                  <p className="line-clamp-2 font-medium leading-snug">{p.title}</p>
                </div>
                <p className="text-sm text-muted-foreground">{p.category}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" />
                    {locationLabel(p)}
                  </span>
                </div>
                <p className="pt-1 text-lg font-semibold text-foreground">ETB {p.price.toLocaleString()}</p>
              </CardContent>
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Link href={href} className="block h-full">
        <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-border/60 shadow-sm transition-all hover:border-violet-200/80 hover:shadow-md">
          <div className="relative aspect-[4/3] bg-muted">
            {badge ? (
              <span className="absolute left-3 top-3 z-[1] rounded-full bg-violet-600/95 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm backdrop-blur-sm">
                {badge}
              </span>
            ) : null}
            {p.imageUrl ? (
              <Image
                src={p.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
            ) : null}
          </div>
          <CardContent className="flex flex-1 flex-col space-y-1 p-4">
            <p className="line-clamp-2 min-h-[2.5rem] font-medium leading-snug">{p.title}</p>
            <p className="text-sm text-muted-foreground">{p.category}</p>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              {locationLabel(p)}
            </p>
            <p className="mt-auto pt-2 text-lg font-semibold">ETB {p.price.toLocaleString()}</p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
