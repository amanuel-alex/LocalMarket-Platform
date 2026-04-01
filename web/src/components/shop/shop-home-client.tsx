"use client";

import { Suspense } from "react";

import { BuyerShopHome } from "@/components/shop/buyer-shop-home";
import { Skeleton } from "@/components/ui/skeleton";

function ShopHomeFallback() {
  return (
    <div className="space-y-10">
      <Skeleton className="h-12 w-64 rounded-xl" />
      <Skeleton className="h-11 w-full max-w-xl rounded-2xl" />
      <Skeleton className="min-h-[88px] w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function ShopHomeClient() {
  return (
    <Suspense fallback={<ShopHomeFallback />}>
      <BuyerShopHome />
    </Suspense>
  );
}
