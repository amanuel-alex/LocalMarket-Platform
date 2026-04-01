"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { DashboardSkeleton, StatCard } from "@/components/dashboard/dashboard-shared";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
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
import { normalizeRole } from "@/lib/roles";
import { fetchOrders, fetchProducts, fetchSellerInsights, toastApiError, type OrderRow } from "@/lib/api";
import { Banknote, Package, ShoppingCart, Store } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

function revenueByProduct(orders: OrderRow[]) {
  const map = new Map<string, { name: string; revenue: number }>();
  for (const o of orders) {
    const title = o.product.title;
    const prev = map.get(o.productId) ?? { name: title, revenue: 0 };
    prev.revenue += o.totalPrice;
    map.set(o.productId, prev);
  }
  return [...map.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((r) => ({ name: r.name.length > 22 ? `${r.name.slice(0, 20)}…` : r.name, revenue: r.revenue }));
}

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
    if (!userId || normalizeRole(user?.role) !== "seller") {
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

  const sellerOrdersAll = useMemo(
    () => (user?.id ? orders.filter((o) => o.sellerId === user.id) : []),
    [orders, user?.id],
  );

  const barData = useMemo(() => revenueByProduct(sellerOrdersAll), [sellerOrdersAll]);
  const myOrdersRecent = sellerOrdersAll.slice(0, 10);

  if (!user) return null;
  if (loading) return <DashboardSkeleton />;
  if (!sellerInsights) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load organizer insights. You need a seller account.
      </p>
    );
  }

  const chartData = sellerInsights.revenueByDay.map((d) => ({
    date: d.date.slice(5),
    amount: d.revenue,
  }));

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-600">EthioLocal</p>
          <h1 className="text-2xl font-semibold tracking-tight">Organizer dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Products, orders, revenue, and pickup verification in one place.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <Store className="size-4 shrink-0 text-violet-600" />
          <span>Seller workspace</span>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total products" value={String(productTotal)} icon={Package} />
        <StatCard title="Your orders" value={String(sellerOrdersAll.length)} icon={ShoppingCart} />
        <StatCard
          title="Revenue (completed)"
          value={`ETB ${sellerInsights.summary.revenueCompleted.toLocaleString()}`}
          icon={Banknote}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue over time</CardTitle>
            <CardDescription>Daily revenue · last {sellerInsights.period.days} days</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pl-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="fillSell" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(262 83% 58%)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
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
                  stroke="hsl(262 83% 58%)"
                  fill="url(#fillSell)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Sales by product</CardTitle>
            <CardDescription>ETB from your orders, top listings</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pl-0 sm:h-72">
            {barData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No order data yet — sales will chart here.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 10 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(262 83% 58%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Latest activity on your storefront</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {myOrdersRecent.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
              No orders yet. When buyers check out, they will show up here with status badges.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myOrdersRecent.map((r) => (
                  <TableRow key={r.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">{r.product.title}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">ETB {r.totalPrice.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
