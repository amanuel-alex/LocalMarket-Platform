"use client";

import { motion } from "framer-motion";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getStoredUser } from "@/lib/auth-storage";
import {
  fetchOrderById,
  fetchOrderReceipt,
  toastApiError,
  type OrderReceiptJson,
  type OrderRow,
} from "@/lib/api";
import { normalizeRole } from "@/lib/roles";

export function BuyerOrderDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const user = getStoredUser();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [receipt, setReceipt] = useState<OrderReceiptJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const load = useCallback(async () => {
    const o = await fetchOrderById(orderId);
    setOrder(o);
    return o;
  }, [orderId]);

  useEffect(() => {
    const u = getStoredUser();
    const role = normalizeRole(u?.role);
    if (!u || role !== "buyer") {
      router.replace(`/login?next=${encodeURIComponent(`/shop/orders/${orderId}`)}`);
      return;
    }
    let c = false;
    (async () => {
      setLoading(true);
      try {
        const o = await load();
        if (!c && o.buyerId !== u.id) {
          toast.error("Not your order");
          router.replace("/shop/my-orders");
          return;
        }
        if (!c && o.status !== "pending") {
          setReceiptLoading(true);
          try {
            const r = await fetchOrderReceipt(orderId);
            if (!c) setReceipt(r);
          } catch {
            if (!c) setReceipt(null);
          } finally {
            if (!c) setReceiptLoading(false);
          }
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
  }, [orderId, router, load]);

  if (loading || !user) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-muted-foreground">Order not found.</p>;
  }

  const qr = order.pickupQrToken ?? "";

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-16">
      <Button variant="ghost" size="sm" className="-ml-2 gap-1 rounded-xl" asChild>
        <Link href="/shop/my-orders">
          <ArrowLeft className="size-4" />
          My orders
        </Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
        <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
      </motion.div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{order.product.title}</CardTitle>
          <CardDescription>Qty {order.quantity}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>ETB {order.totalPrice.toLocaleString()}</span>
          </div>
          {order.status === "pending" ? (
            <Button asChild className="mt-2 w-full rounded-xl">
              <Link href={`/shop/checkout/${order.id}`}>Complete payment</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {qr ? (
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Pickup QR</CardTitle>
            <CardDescription>Present at the counter for the seller to scan or verify.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="rounded-2xl border border-border/60 bg-card p-4 dark:bg-zinc-900">
              <QRCodeSVG value={qr} size={200} level="M" includeMargin />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {order.status !== "pending" ? (
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              Receipt
            </CardTitle>
            <CardDescription>Platform fee rate from live settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {receiptLoading ? (
              <SkeletonInline />
            ) : receipt ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt #</span>
                  <span className="font-mono text-xs">{receipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission</span>
                  <span>{receipt.platform.commissionRatePercent}% (seller payout)</span>
                </div>
                <Separator />
                {receipt.lineItems.map((line, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{line.description}</span>
                    <span>ETB {line.lineTotal.toLocaleString()}</span>
                  </div>
                ))}
                {receipt.payment ? (
                  <p className="text-xs text-muted-foreground">
                    Payment {receipt.payment.status} · ETB {receipt.payment.amount.toLocaleString()}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">Receipt could not be loaded.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function SkeletonInline() {
  return <div className="h-24 animate-pulse rounded-xl bg-muted" />;
}
