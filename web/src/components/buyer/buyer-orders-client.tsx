"use client";

import { motion } from "framer-motion";
import { ExternalLink, PackageOpen, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStoredUser } from "@/lib/auth-storage";
import { fetchOrders, toastApiError, type OrderRow } from "@/lib/api";
import { normalizeRole } from "@/lib/roles";

function deliveryLabel(o: OrderRow) {
  if (o.status === "completed" && o.deliveryConfirmedAt) return "Seller confirmed handoff";
  if (o.status === "completed") return "Pickup verified";
  if (o.status === "paid") return "Awaiting pickup";
  if (o.status === "pending") return "Awaiting payment";
  return "—";
}

export function BuyerOrdersClient({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const user = getStoredUser();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    const role = normalizeRole(u?.role);
    if (!u || role !== "buyer") {
      setLoading(false);
      if (!embedded) router.replace("/login?next=%2Fshop%2Fmy-orders");
      return;
    }
    let c = false;
    (async () => {
      try {
        const list = await fetchOrders();
        if (!c) setRows(list);
      } catch (e) {
        if (!c) toast.error(toastApiError(e));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [router, embedded]);

  const mine = useMemo(
    () => (user?.id ? rows.filter((o) => o.buyerId === user.id) : []),
    [rows, user?.id],
  );

  if (!user || normalizeRole(user.role) !== "buyer") {
    if (embedded) {
      return (
        <p className="text-sm text-muted-foreground">
          Sign in as a buyer to see orders — or open{" "}
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>
          .
        </p>
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">EthioLocal</p>
          <h1 className="text-2xl font-semibold tracking-tight">My orders</h1>
          <p className="text-sm text-muted-foreground">Purchases, payment status, and pickup progress</p>
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        {!loading && mine.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted shadow-inner">
              <PackageOpen className="size-7 text-muted-foreground" />
            </div>
            <p className="font-medium">No orders yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Browse the marketplace and checkout — your QR and receipts will appear here.
            </p>
            <Button asChild className="rounded-xl">
              <Link href="/shop">Browse shop</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                : mine.map((o) => (
                    <TableRow key={o.id} className="transition-colors hover:bg-muted/40">
                      <TableCell className="font-medium">{o.product.title}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <Truck className="size-3.5 shrink-0" />
                          {deliveryLabel(o)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">ETB {o.totalPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-1 rounded-lg" asChild>
                          <Link href={`/shop/orders/${o.id}`}>
                            <ExternalLink className="mr-1 size-3.5" />
                            View
                          </Link>
                        </Button>
                        {o.status === "pending" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-muted-foreground"
                            onClick={() => setCancelId(o.id)}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      <Dialog open={cancelId !== null} onOpenChange={(o) => !o && setCancelId(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              Self-service cancellation is not available yet on EthioLocal. Please contact support with order ID{" "}
              <span className="font-mono text-xs">{cancelId}</span> if you need to stop a pending checkout.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" className="rounded-xl" onClick={() => setCancelId(null)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
