"use client";

import { motion } from "framer-motion";
import { Download, Eye, PackageOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStoredUser } from "@/lib/auth-storage";
import { fetchOrderById, fetchOrders, toastApiError, type OrderRow } from "@/lib/api";

function escapeCsvCell(s: string) {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function ordersToCsv(rows: OrderRow[]) {
  const headers = ["id", "product", "status", "quantity", "total_etb", "created_at"];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        escapeCsvCell(r.product.title),
        escapeCsvCell(r.status),
        String(r.quantity),
        String(r.totalPrice),
        escapeCsvCell(r.createdAt),
      ].join(","),
    );
  }
  return lines.join("\r\n");
}

export function SellerOrdersClient() {
  const user = getStoredUser();
  const userId = user?.id;
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OrderRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusTab, setStatusTab] = useState<"all" | "pending" | "paid" | "completed">("all");

  useEffect(() => {
    let c = false;
    (async () => {
      if (!userId) {
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
  }, [userId]);

  const mine = useMemo(
    () => (userId ? rows.filter((o) => o.sellerId === userId) : []),
    [rows, userId],
  );

  const filtered = useMemo(() => {
    if (statusTab === "all") return mine;
    return mine.filter((o) => o.status.toLowerCase() === statusTab);
  }, [mine, statusTab]);

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

  function exportCsv() {
    if (filtered.length === 0) {
      toast.message("No orders to export");
      return;
    }
    const blob = new Blob([ordersToCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ethiolocal-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  if (!user) {
    return <p className="text-sm text-muted-foreground">Sign in to view orders.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Incoming orders for your EthioLocal listings — filter by status and export for accounting.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full shrink-0 rounded-xl shadow-sm sm:w-auto"
          disabled={loading || filtered.length === 0}
          onClick={exportCsv}
        >
          <Download className="mr-2 size-4" />
          Export CSV
        </Button>
      </div>

      <Tabs
        value={statusTab}
        onValueChange={(v) => setStatusTab(v as typeof statusTab)}
        className="w-full"
      >
        <TabsList className="h-10 w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/60 p-1 sm:w-auto">
          <TabsTrigger value="all" className="rounded-xl">
            All ({mine.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-xl">
            Pending
          </TabsTrigger>
          <TabsTrigger value="paid" className="rounded-xl">
            Paid
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-xl">
            Completed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        {!loading && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted shadow-inner">
              <PackageOpen className="size-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No orders in this view</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              When buyers purchase your products, they will appear here with live status updates.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Qty</TableHead>
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
                : filtered.map((o) => (
                    <TableRow key={o.id} className="transition-colors hover:bg-muted/40">
                      <TableCell className="font-medium">{o.product.title}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{o.quantity}</TableCell>
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
        )}
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
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{detail.id}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Product</span>
                <span className="text-right">{detail.product.title}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Status</span>
                <OrderStatusBadge status={detail.status} />
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Quantity</span>
                <span>{detail.quantity}</span>
              </div>
              <div className="flex justify-between gap-4 font-medium">
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
