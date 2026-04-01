"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LandingAiChat } from "@/components/marketing/landing-ai-chat";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProducts, toastApiError, type ProductRow } from "@/lib/api";

export function ShopHomeClient() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchProducts({ limit: 48, page: 1 });
        if (!c) setProducts(res.products);
      } catch (e) {
        if (!c) toast.error(toastApiError(e));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Browse local listings. Checkout and order history stay tied to your account when you sign in.
        </p>
      </div>

      <section aria-label="Assistant" className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-6">
        <LandingAiChat />
      </section>

      <section aria-label="Products">
        <h2 className="mb-4 text-lg font-medium">Products</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products yet. Check back soon.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative aspect-[4/3] bg-muted">
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
                  <CardContent className="space-y-1 p-4">
                    <p className="line-clamp-2 font-medium leading-snug">{p.title}</p>
                    <p className="text-sm text-muted-foreground">{p.category}</p>
                    <p className="text-lg font-semibold">ETB {p.price.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
