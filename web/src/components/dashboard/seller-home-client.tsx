"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { DashboardSkeleton, StatCard } from "@/components/dashboard/dashboard-shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStoredUser } from "@/lib/auth-storage";
import { fetchOrders, fetchProducts, fetchSellerInsights, toastApiError, type OrderRow } from "@/lib/api";
import { Banknote, Package, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

export function SellerHomeClient() {
  const user = getStoredUser();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [sellerInsights, setSellerInsights] = useState<Awaited<ReturnType<typeof fetchSellerInsights>> | null>(
    null,
  );
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [productTotal, setProductTotal] = useState(0);

  useEffect(() => {
    if (!userId || user?.role !== "seller") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [o, ins, pr] = await Promise.all([
          fetchOrders(),
          fetchSellerInsights(),
          fetchProducts({ sellerId: userId, limit: 1, page: 1 }),
        ]);
        if (cancelled) return;
        setOrders(o);
        setSellerInsights(ins);
        setProductTotal(pr.total);
      } catch (e) {
        if (!cancelled) toast.error(toastApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, user?.role]);

  if (!user) return null;
  if (loading) return <DashboardSkeleton />;
  if (!sellerInsights) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load seller insights. You need a seller account.
      </p>
    );
  }

  const myOrders = orders.filter((o) => o.sellerId === user.id).slice(0, 10);
  const chartData = sellerInsights.revenueByDay.map((d) => ({
    date: d.date.slice(5),
    amount: d.revenue,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seller overview</h1>
        <p className="text-sm text-muted-foreground">Products, orders, revenue, and payouts</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Products" value={String(productTotal)} icon={Package} />
        <StatCard
          title="Orders (you)"
          value={String(orders.filter((o) => o.sellerId === user.id).length)}
          icon={ShoppingCart}
        />
        <StatCard
          title="Revenue (completed)"
          value={`ETB ${sellerInsights.summary.revenueCompleted.toLocaleString()}`}
          icon={Banknote}
        />
      </div>
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Sales</CardTitle>
          <CardDescription>Revenue by day · last {sellerInsights.period.days} days</CardDescription>
        </CardHeader>
        <CardContent className="h-72 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="fillSell" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(221 83% 53%)"
                fill="url(#fillSell)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myOrders.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.product.title}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.status}</span>
                  </TableCell>
                  <TableCell className="text-right">ETB {r.totalPrice.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
