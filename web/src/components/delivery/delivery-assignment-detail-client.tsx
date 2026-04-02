"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MapPin, MessageCircle, Navigation, Package, Phone, Play, QrCode } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { DeliveryAssignmentBadge } from "@/components/delivery/delivery-assignment-badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchDeliveryAssignment,
  postDeliveryStart,
  toastApiError,
  type DeliveryAssignment,
} from "@/lib/api";

function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function DeliveryAssignmentDetailClient({ orderId }: { orderId: string }) {
  const [a, setA] = useState<DeliveryAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    const x = await fetchDeliveryAssignment(orderId);
    setA(x);
    return x;
  }, [orderId]);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        if (!c) toast.error(toastApiError(e));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [load]);

  async function startDelivery() {
    setStarting(true);
    try {
      const next = await postDeliveryStart(orderId);
      setA(next);
      toast.success("Delivery marked as in progress");
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setStarting(false);
    }
  }

  if (loading || !a) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pb-10">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const canStart = a.status === "paid" && !a.deliveryStartedAt;
  const showQrCta = a.status === "paid" && a.deliveryStartedAt;

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-12">
      <Button variant="ghost" size="sm" className="-ml-2 gap-1 rounded-xl" asChild>
        <Link href="/delivery/assignments">
          <ArrowLeft className="size-4" />
          Assignments
        </Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <p className="font-mono text-xs text-muted-foreground">{a.id}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{a.product.title}</h1>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={a.status} />
          <DeliveryAssignmentBadge assignment={a} />
        </div>
      </motion.div>

      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm">
        {a.product.imageUrl ? (
          <Image
            src={a.product.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 512px"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Package className="size-12" />
          </div>
        )}
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Pickup</CardTitle>
          <CardDescription>Listing coordinates (seller handoff)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href={mapsUrl(a.pickup.lat, a.pickup.lng)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <Navigation className="size-4 shrink-0" />
            Open pickup in Maps
          </a>
          <p className="text-xs text-muted-foreground">
            {a.pickup.lat.toFixed(5)}, {a.pickup.lng.toFixed(5)}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Drop-off</CardTitle>
          <CardDescription>{a.dropoff.note}</CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href={mapsUrl(a.dropoff.lat, a.dropoff.lng)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <MapPin className="size-4 shrink-0" />
            Reference map (confirm address with buyer)
          </a>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Buyer</p>
            <p className="font-medium">{a.buyer.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                <a href={`tel:${a.buyer.phone}`}>
                  <Phone className="mr-2 size-3.5" />
                  Call
                </a>
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                <a href={`sms:${a.buyer.phone}`}>
                  <MessageCircle className="mr-2 size-3.5" />
                  SMS
                </a>
              </Button>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Seller</p>
            <p className="font-medium">{a.seller.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                <a href={`tel:${a.seller.phone}`}>
                  <Phone className="mr-2 size-3.5" />
                  Call
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-cyan-200/60 bg-cyan-50/30 shadow-sm dark:border-cyan-900/40 dark:bg-cyan-950/20">
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
          <CardDescription>Qty {a.quantity} · ETB {a.totalPrice.toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {canStart ? (
            <Button
              type="button"
              className="h-11 w-full rounded-2xl shadow-sm"
              disabled={starting}
              onClick={() => void startDelivery()}
            >
              <Play className="mr-2 size-4" />
              {starting ? "Starting…" : "Start delivery"}
            </Button>
          ) : null}
          {showQrCta ? (
            <Button asChild className="h-11 w-full rounded-2xl shadow-sm">
              <Link href="/delivery/qr-verify">
                <QrCode className="mr-2 size-4" />
                Verify pickup QR
              </Link>
            </Button>
          ) : null}
          {a.status === "completed" ? (
            <p className="text-center text-sm text-muted-foreground">This run is completed.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
