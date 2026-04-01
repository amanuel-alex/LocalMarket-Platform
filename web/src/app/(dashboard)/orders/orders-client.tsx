"use client";

import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { fetchOrderById, fetchOrders, toastApiError, type OrderRow } from "@/lib/api";

export function OrdersClient() {
  const user = getStoredUser();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OrderRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
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
  }, [user]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const o = await fetchOrderById(id);
      setDetail(o);
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setDetailLoading(false);
    }
  }

  if (!user) {
    return <p className="text-sm text-muted-foreground">Sign in to view orders.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">Orders linked to your account</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Product</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.map((o) => (
                  <TableRow key={o.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="font-medium">{o.product.title}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {o.buyerId === user.id ? "Buyer" : o.sellerId === user.id ? "Seller" : "—"}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-right">ETB {o.totalPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => void openDetail(o.id)}
                      >
                        <Eye className="mr-1 size-3.5" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog
        open={detailLoading || detail !== null}
        onOpenChange={(v) => {
          if (!v) {
            setDetail(null);
            setDetailLoading(false);
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order details</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : detail ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{detail.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product</span>
                <span>{detail.product.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <OrderStatusBadge status={detail.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span>{detail.quantity}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>ETB {detail.totalPrice.toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Created {new Date(detail.createdAt).toLocaleString()}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
