"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getStoredUser } from "@/lib/auth-storage";
import {
  fetchOrderById,
  initiatePayment,
  toastApiError,
  type InitiatePaymentResult,
  type OrderRow,
} from "@/lib/api";
import { simulateMpesaCallbackDev } from "@/lib/dev-payment";
import { normalizeRole } from "@/lib/roles";

type PayMethod = "mpesa" | "telebirr" | "bank";

export function BuyerCheckoutClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const user = getStoredUser();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PayMethod>("mpesa");
  const [phone, setPhone] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [initResult, setInitResult] = useState<InitiatePaymentResult | null>(null);
  const [simBusy, setSimBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadOrder = useCallback(async () => {
    const o = await fetchOrderById(orderId);
    setOrder(o);
    return o;
  }, [orderId]);

  useEffect(() => {
    const u = getStoredUser();
    const role = normalizeRole(u?.role);
    if (!u || role !== "buyer") {
      router.replace(`/login?next=${encodeURIComponent(`/shop/checkout/${orderId}`)}`);
      return;
    }
    let c = false;
    (async () => {
      setLoading(true);
      try {
        const o = await loadOrder();
        if (!c && o.buyerId !== u.id) {
          toast.error("This order is not yours");
          router.replace("/shop");
        }
      } catch (e) {
        if (!c) toast.error(toastApiError(e));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [orderId, router, loadOrder]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      void (async () => {
        try {
          const o = await loadOrder();
          if (o.status === "paid" || o.status === "completed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setOrder(o);
            toast.success("Payment received");
          }
        } catch {
          /* ignore transient */
        }
      })();
    }, 2500);
  }

  async function payMpesa() {
    if (!order || order.status !== "pending") return;
    setPayBusy(true);
    try {
      const res = await initiatePayment({
        orderId: order.id,
        ...(phone.replace(/\D/g, "").length >= 10
          ? { phone: phone.replace(/\D/g, "") }
          : {}),
      });
      setInitResult(res);
      toast.success("STK push initiated — confirm on your phone");
      startPolling();
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setPayBusy(false);
    }
  }

  async function devSimulate() {
    const id = initResult?.payment.checkoutRequestId;
    if (!id) return;
    setSimBusy(true);
    try {
      await simulateMpesaCallbackDev(id);
      const o = await loadOrder();
      setOrder(o);
      toast.success("Dev simulation complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : toastApiError(e));
    } finally {
      setSimBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <p className="text-sm text-muted-foreground">
        Order not found.{" "}
        <Link href="/shop" className="text-primary underline">
          Back to shop
        </Link>
      </p>
    );
  }

  if (order.buyerId !== user.id) {
    return null;
  }

  const paid = order.status === "paid" || order.status === "completed";
  const qrValue = order.pickupQrToken ?? "";

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-16">
      <Button variant="ghost" size="sm" className="-ml-2 gap-1 rounded-xl" asChild>
        <Link href={`/shop/product/${order.productId}`}>
          <ArrowLeft className="size-4" />
          Back to product
        </Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Payment</h1>
        <p className="text-sm text-muted-foreground">{order.product.title}</p>
      </motion.div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity</span>
            <span>{order.quantity}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total due</span>
            <span>ETB {order.totalPrice.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {paid && qrValue ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="rounded-2xl border-emerald-200/80 bg-emerald-50/50 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-emerald-900 dark:text-emerald-100">
                <CheckCircle2 className="size-5" />
                Payment successful
              </CardTitle>
              <CardDescription>Show this QR at pickup.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-inner dark:bg-zinc-900">
                <QRCodeSVG value={qrValue} size={220} level="M" includeMargin />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                If the code does not scan, ask the seller to enter the token manually in QR verification.
              </p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href={`/shop/orders/${order.id}`}>Order details</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : paid && !qrValue ? (
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Paid — pickup QR is no longer shown (already used or completed). See{" "}
            <Link href={`/shop/orders/${order.id}`} className="text-primary underline">
              order details
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Payment method</CardTitle>
              <CardDescription>EthioLocal uses M-Pesa STK today; more wallets soon.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => setMethod("mpesa")}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                  method === "mpesa"
                    ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/30"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <Smartphone className="size-5 text-violet-600" />
                <div>
                  <p className="font-medium">M-Pesa</p>
                  <p className="text-xs text-muted-foreground">Safaricom STK push (simulated in dev)</p>
                </div>
              </button>
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl border border-dashed p-4 text-left opacity-50"
              >
                <div>
                  <p className="font-medium">Telebirr</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </button>
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl border border-dashed p-4 text-left opacity-50"
              >
                <div>
                  <p className="font-medium">Bank transfer</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </button>
            </CardContent>
          </Card>

          {method === "mpesa" ? (
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">M-Pesa</CardTitle>
                <CardDescription>Optional phone (10–15 digits). Mock mode may complete without it.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesa-phone">Phone number</Label>
                  <Input
                    id="mpesa-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 2519xxxxxxxx"
                    className="rounded-xl"
                  />
                </div>
                <Button
                  type="button"
                  className="h-11 w-full rounded-2xl"
                  disabled={payBusy || order.status !== "pending"}
                  onClick={() => void payMpesa()}
                >
                  {payBusy ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Starting…
                    </>
                  ) : (
                    "Pay with M-Pesa"
                  )}
                </Button>
                {initResult ? (
                  <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p className="font-mono break-all">{initResult.stkPush.CustomerMessage}</p>
                    <Separator className="my-2" />
                    <p>
                      Checkout ID:{" "}
                      <span className="font-mono">{initResult.payment.checkoutRequestId}</span>
                    </p>
                  </div>
                ) : null}
                {process.env.NODE_ENV === "development" && initResult ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full rounded-xl"
                    disabled={simBusy}
                    onClick={() => void devSimulate()}
                  >
                    {simBusy ? "Simulating…" : "Simulate M-Pesa success (dev)"}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
