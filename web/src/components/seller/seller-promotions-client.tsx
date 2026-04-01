"use client";

import { motion } from "framer-motion";
import { Megaphone, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getStoredUser } from "@/lib/auth-storage";
import { normalizeRole } from "@/lib/roles";
import { fetchProducts, toastApiError, type ProductRow } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

const PROMOS_KEY = "ethiolocal-seller-promos-v1";
const FEATURED_KEY = "ethiolocal-featured-requests-v1";

export type LocalPromo = {
  id: string;
  code: string;
  discountPct: number;
  maxUses: number;
  used: number;
  createdAt: string;
};

export type FeaturedRequest = {
  id: string;
  productId: string;
  productTitle: string;
  note: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function SellerPromotionsClient() {
  const user = getStoredUser();
  const sellerId = user?.id;
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [promos, setPromos] = useState<LocalPromo[]>([]);
  const [featured, setFeatured] = useState<FeaturedRequest[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [promoOpen, setPromoOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountPct, setDiscountPct] = useState("10");
  const [maxUses, setMaxUses] = useState("100");

  const [featuredOpen, setFeaturedOpen] = useState(false);
  const [featuredProductId, setFeaturedProductId] = useState("");
  const [featuredNote, setFeaturedNote] = useState("");

  const loadProducts = useCallback(async () => {
    if (!sellerId) return;
    setLoadingProducts(true);
    try {
      const res = await fetchProducts({ sellerId, limit: 100, page: 1 });
      setProducts(res.products);
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setLoadingProducts(false);
    }
  }, [sellerId]);

  useEffect(() => {
    setPromos(loadJson<LocalPromo[]>(PROMOS_KEY, []));
    setFeatured(loadJson<FeaturedRequest[]>(FEATURED_KEY, []));
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (products.length > 0 && !featuredProductId) {
      setFeaturedProductId(products[0]!.id);
    }
  }, [products, featuredProductId]);

  function persistPromos(next: LocalPromo[]) {
    setPromos(next);
    saveJson(PROMOS_KEY, next);
  }

  function persistFeatured(next: FeaturedRequest[]) {
    setFeatured(next);
    saveJson(FEATURED_KEY, next);
  }

  function addPromo() {
    const pct = Number(discountPct);
    const max = Number(maxUses);
    const c = code.trim().toUpperCase();
    if (!c || c.length < 3) {
      toast.error("Enter a promo code (at least 3 characters)");
      return;
    }
    if (Number.isNaN(pct) || pct < 1 || pct > 99) {
      toast.error("Discount must be between 1 and 99%");
      return;
    }
    if (Number.isNaN(max) || max < 1) {
      toast.error("Max uses must be at least 1");
      return;
    }
    const next: LocalPromo = {
      id: crypto.randomUUID(),
      code: c,
      discountPct: pct,
      maxUses: max,
      used: 0,
      createdAt: new Date().toISOString(),
    };
    persistPromos([next, ...promos]);
    setPromoOpen(false);
    setCode("");
    setDiscountPct("10");
    setMaxUses("100");
    toast.success("Promo saved locally — wire to checkout when your API is ready.");
  }

  function removePromo(id: string) {
    persistPromos(promos.filter((p) => p.id !== id));
    toast.success("Promo removed");
  }

  function simulateUse(id: string) {
    persistPromos(
      promos.map((p) =>
        p.id === id && p.used < p.maxUses ? { ...p, used: p.used + 1 } : p,
      ),
    );
    toast.message("Recorded a test redemption (local only)");
  }

  function submitFeaturedRequest() {
    const p = products.find((x) => x.id === featuredProductId);
    if (!p) {
      toast.error("Pick a product");
      return;
    }
    const row: FeaturedRequest = {
      id: crypto.randomUUID(),
      productId: p.id,
      productTitle: p.title,
      note: featuredNote.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    persistFeatured([row, ...featured]);
    setFeaturedOpen(false);
    setFeaturedNote("");
    toast.success("Request recorded — an admin can approve featured placement later.");
  }

  if (!user || normalizeRole(user.role) !== "seller") {
    return (
      <p className="text-sm text-muted-foreground">Promotions are available for seller accounts.</p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Promotions</h1>
        <p className="text-sm text-muted-foreground">
          Plan discounts and featured visibility for EthioLocal. Promo codes and requests are stored in this
          browser until backend APIs are connected.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Megaphone className="size-5 text-violet-600" />
                  Promo codes
                </CardTitle>
                <CardDescription>Local draft codes — track usage for your own planning.</CardDescription>
              </div>
              <Button type="button" size="sm" className="rounded-xl" onClick={() => setPromoOpen(true)}>
                Add code
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {promos.length === 0 ? (
                <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  No promo codes yet. Create one to share with customers.
                </p>
              ) : (
                promos.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-mono text-sm font-semibold">{p.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.discountPct}% off · {p.used}/{p.maxUses} uses
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => simulateUse(p.id)}
                      >
                        +1 use (test)
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-lg text-destructive"
                        onClick={() => removePromo(p.id)}
                        aria-label="Remove promo"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="size-5 text-amber-500" />
                  Featured listings
                </CardTitle>
                <CardDescription>Request spotlight placement — pending admin approval.</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-xl"
                disabled={loadingProducts || products.length === 0}
                onClick={() => setFeaturedOpen(true)}
              >
                Request feature
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {featured.length === 0 ? (
                <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  No requests yet. Highlight a product to reach more buyers on EthioLocal.
                </p>
              ) : (
                featured.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-border/60 bg-muted/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{f.productTitle}</p>
                      <Badge
                        variant={f.status === "rejected" ? "destructive" : "secondary"}
                        className={
                          f.status === "approved"
                            ? "border-emerald-200 bg-emerald-100 font-medium capitalize text-emerald-900"
                            : "capitalize"
                        }
                      >
                        {f.status}
                      </Badge>
                    </div>
                    {f.note ? (
                      <p className="mt-2 text-xs text-muted-foreground">{f.note}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(f.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={promoOpen} onOpenChange={setPromoOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New promo code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promo-code">Code</Label>
              <Input
                id="promo-code"
                className="rounded-xl font-mono uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SUMMER2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promo-pct">Discount %</Label>
                <Input
                  id="promo-pct"
                  type="number"
                  min={1}
                  max={99}
                  className="rounded-xl"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-max">Max uses</Label>
                <Input
                  id="promo-max"
                  type="number"
                  min={1}
                  className="rounded-xl"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setPromoOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" onClick={addPromo}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={featuredOpen} onOpenChange={setFeaturedOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request featured listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={featuredProductId} onValueChange={setFeaturedProductId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feat-note">Note to admin (optional)</Label>
              <Textarea
                id="feat-note"
                className="rounded-xl"
                rows={3}
                value={featuredNote}
                onChange={(e) => setFeaturedNote(e.target.value)}
                placeholder="Why should this listing be featured?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setFeaturedOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" onClick={submitFeaturedRequest}>
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
