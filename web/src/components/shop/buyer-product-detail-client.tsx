"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Minus, Plus, ShieldCheck, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getStoredUser } from "@/lib/auth-storage";
import { createOrder, fetchProductById, toastApiError, type ProductRow } from "@/lib/api";
import { normalizeRole } from "@/lib/roles";
import { PLATFORM_FEE_ESTIMATE_PERCENT } from "@/lib/shop-constants";

const MAX_QTY = 99;
const DEMO_PROMO_CODES = new Set(["ETHIO10", "LOCAL", "WELCOME"]);

export function BuyerProductDetailClient({ productId }: { productId: string }) {
  const router = useRouter();
  const user = getStoredUser();
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      try {
        const p = await fetchProductById(productId);
        if (!c) setProduct(p);
      } catch (e) {
        if (!c) toast.error(toastApiError(e));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [productId]);

  const maxOrderQty = useMemo(() => {
    if (!product) return MAX_QTY;
    const cap = Math.min(MAX_QTY, product.availableStock);
    return Math.max(0, cap);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    if (maxOrderQty < 1) return;
    setQty((q) => Math.min(Math.max(1, q), maxOrderQty));
  }, [product, maxOrderQty]);

  const mapsUrl = useMemo(() => {
    if (!product) return "";
    return `https://www.google.com/maps?q=${product.location.lat},${product.location.lng}`;
  }, [product]);

  const subtotal = product ? product.price * qty : 0;
  const estimatedFee = Math.round(subtotal * (PLATFORM_FEE_ESTIMATE_PERCENT / 100) * 100) / 100;
  const promoDiscount =
    promoApplied && DEMO_PROMO_CODES.has(promoApplied) ? Math.round(subtotal * 0.1 * 100) / 100 : 0;

  function applyPromo() {
    const c = promoInput.trim().toUpperCase();
    if (!c) {
      toast.error("Enter a code");
      return;
    }
    if (DEMO_PROMO_CODES.has(c)) {
      setPromoApplied(c);
      toast.success("Promo applied (10% off shown for planning — charged total follows your order on payment).");
    } else {
      toast.error("Unknown code — try ETHIO10, LOCAL, or WELCOME for a demo discount preview.");
    }
  }

  async function startCheckout() {
    if (!product) return;
    if (product.isSoldOut || product.availableStock < 1) {
      toast.error("This product is sold out");
      return;
    }
    if (qty > product.availableStock) {
      toast.error("Not enough stock for this quantity");
      return;
    }
    const role = normalizeRole(user?.role);
    if (!user || role !== "buyer") {
      toast.message("Sign in as a buyer to order");
      router.push(`/login?next=${encodeURIComponent(`/shop/product/${product.id}`)}`);
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder({ productId: product.id, quantity: qty });
      toast.success("Order created — continue to payment");
      router.push(`/shop/checkout/${order.id}`);
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !product) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="aspect-[4/3] max-w-xl animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <Button variant="ghost" size="sm" className="-ml-2 gap-1 rounded-xl" asChild>
        <Link href="/shop">
          <ArrowLeft className="size-4" />
          Back to shop
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" unoptimized />
            ) : null}
          </div>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Venue & pickup</CardTitle>
              <CardDescription>In-store pickup — show your QR after payment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
              >
                <MapPin className="size-4 shrink-0" />
                Open in Google Maps ({product.location.lat.toFixed(4)}, {product.location.lng.toFixed(4)})
              </a>
              <p className="text-muted-foreground">
                Coordinates point to the listing location. Confirm exact pickup instructions with the seller if
                needed.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-6"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">EthioLocal</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{product.title}</h1>
            <p className="mt-2 text-muted-foreground">{product.category}</p>
          </div>

          <div className="max-w-none text-sm leading-relaxed text-muted-foreground">
            <p className="whitespace-pre-wrap">{product.description || "No description provided."}</p>
          </div>

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Price breakdown</CardTitle>
              <CardDescription>Estimates before payment — official fees appear on your receipt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit price</span>
                <span>ETB {product.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span>{qty}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span>ETB {subtotal.toLocaleString()}</span>
              </div>
              {promoDiscount > 0 ? (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <span>Demo promo ({promoApplied})</span>
                  <span>− ETB {promoDiscount.toLocaleString()}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-muted-foreground">
                <span>Est. platform fee (~{PLATFORM_FEE_ESTIMATE_PERCENT}%)</span>
                <span>ETB {estimatedFee.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Platform commission is deducted from the seller payout; your card shows the order total you pay.
              </p>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>Pickup · ETB 0</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>You pay (checkout)</span>
                <span>ETB {subtotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Promo previews do not change the server order total yet — full M-Pesa integration uses the order
                amount from EthioLocal.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="size-4" />
                Promo code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Try ETHIO10"
                className="rounded-xl"
              />
              <Button type="button" variant="secondary" className="rounded-xl" onClick={applyPromo}>
                Apply
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-violet-200/60 bg-violet-50/40 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/20">
            <CardHeader>
              <CardTitle className="text-base">Order</CardTitle>
              <CardDescription>
                {product.isSoldOut || product.availableStock < 1
                  ? "This listing is currently sold out."
                  : `${product.availableStock} available now (inventory updates when orders are placed).`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">Quantity</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-10 rounded-xl"
                    disabled={qty <= 1 || maxOrderQty < 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-8 text-center text-lg font-semibold">{qty}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="size-10 rounded-xl"
                    disabled={maxOrderQty < 1 || qty >= maxOrderQty}
                    onClick={() => setQty((q) => Math.min(maxOrderQty, q + 1))}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                size="lg"
                className="h-12 w-full rounded-2xl text-base shadow-md"
                disabled={submitting || product.isSoldOut || product.availableStock < 1}
                onClick={() => void startCheckout()}
              >
                {submitting
                  ? "Creating order…"
                  : product.isSoldOut || product.availableStock < 1
                    ? "Sold out"
                    : "Checkout"}
              </Button>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>Secure checkout with M-Pesa STK push. You will receive a pickup QR when payment completes.</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
