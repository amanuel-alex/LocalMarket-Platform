"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getStoredUser } from "@/lib/auth-storage";
import { fetchSellerInsights, toastApiError, type SellerInsights } from "@/lib/api";
import { Banknote, Package, ShoppingCart } from "lucide-react";

export function SellerPayoutsClient() {
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [ins, setIns] = useState<SellerInsights | null>(null);

  useEffect(() => {
    if (!user?.id || user.role !== "seller") {
      setLoading(false);
      return;
    }
    let c = false;
    (async () => {
      setLoading(true);
      try {
        const d = await fetchSellerInsights();
        if (!c) setIns(d);
      } catch (e) {
        if (!c) toast.error(toastApiError(e));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [user?.id, user?.role]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!ins) {
    return <p className="text-sm text-muted-foreground">Could not load payout summary.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payouts</h1>
        <p className="text-sm text-muted-foreground">
          Revenue and pipeline after pickup. Platform commission applies when escrow is released to your available
          balance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed revenue</CardTitle>
              <Banknote className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">ETB {ins.summary.revenueCompleted.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Paid · awaiting pickup</CardTitle>
              <ShoppingCart className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{ins.summary.paidAwaitingPickup}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline value</CardTitle>
              <Package className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">ETB {ins.summary.pipelineValue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>How payouts work</CardTitle>
          <CardDescription>Same rules as the seller overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Buyer pays → funds held in escrow until QR pickup is verified.</p>
          <p>You confirm delivery → admin can release escrow to your available balance (after platform fee).</p>
        </CardContent>
      </Card>
    </div>
  );
}
