"use client";

import Link from "next/link";
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

import { DashboardSkeleton, ordersByDay, StatCard } from "@/components/dashboard/dashboard-shared";
import { Button } from "@/components/ui/button";
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
import { fetchOrders, fetchProducts, toastApiError, type OrderRow } from "@/lib/api";
import { Banknote, Package, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

export function BuyerAccountHomeClient() {
  const user = getStoredUser();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [catalogTotal, setCatalogTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!userId || user?.role !== "buyer") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [o, cat] = await Promise.all([
          fetchOrders(),
          fetchProducts({ limit: 1, page: 1 }),
        ]);
        if (cancelled) return;
        setOrders(o);
        setCatalogTotal(cat.total);
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

  const buyerOrders = orders.filter((o) => o.buyerId === user.id);
  const spent = buyerOrders.reduce((s, o) => s + o.totalPrice, 0);
  const buyerChartData = ordersByDay(buyerOrders, 14).map((d) => ({
    date: d.date.slice(5),
    amount: d.amount,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
          <p className="text-sm text-muted-foreground">Orders and spending · browse the marketplace in Shop</p>
        </div>
        <Button asChild variant="outline" className="w-fit rounded-xl">
          <Link href="/shop">Go to shop</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Your orders" value={String(buyerOrders.length)} icon={ShoppingCart} />
        <StatCard title="Total spent" value={`ETB ${spent.toLocaleString()}`} icon={Banknote} />
        <StatCard
          title="In marketplace"
          value={catalogTotal !== null ? String(catalogTotal) : "—"}
          icon={Package}
        />
      </div>
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Spending trend</CardTitle>
          <CardDescription>Your order totals by day · last 14 days</CardDescription>
        </CardHeader>
        <CardContent className="h-72 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={buyerChartData} margin={{ left: 8, right: 8 }}>
              <defs>
                <linearGradient id="fillBuyer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(280 65% 48%)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(280 65% 48%)" stopOpacity={0} />
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
                stroke="hsl(280 65% 48%)"
                fill="url(#fillBuyer)"
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
              {buyerOrders.slice(0, 10).map((r) => (
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
      <p className="text-sm text-muted-foreground">
        Want to sell? Ask an admin to change your role to <strong>seller</strong>.
      </p>
    </div>
  );
}
