"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  fetchAdminDashboard,
  fetchOrders,
  fetchProducts,
  fetchSellerInsights,
  toastApiError,
  type AdminDashboard,
  type OrderRow,
  type SellerInsights,
} from "@/lib/api";
import { Banknote, Package, ShoppingCart } from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  icon: typeof Package;
  loading?: boolean;
}) {
  return (
    <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 24 }}>
      <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24 rounded-lg" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardClient() {
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminDashboard | null>(null);
  const [sellerInsights, setSellerInsights] = useState<SellerInsights | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [productTotal, setProductTotal] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (user.role === "admin") {
          const d = await fetchAdminDashboard();
          if (!cancelled) setAdminData(d);
        } else {
          const [o, ins] = await Promise.all([
            fetchOrders(),
            user.role === "seller" ? fetchSellerInsights() : Promise.resolve(null),
          ]);
          if (cancelled) return;
          setOrders(o);
          if (ins) setSellerInsights(ins);
          if (user.role === "seller") {
            const pr = await fetchProducts({ sellerId: user.id, limit: 1, page: 1 });
            if (!cancelled) setProductTotal(pr.total);
          }
        }
      } catch (e) {
        if (!cancelled) toast.error(toastApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <Card className="mx-auto max-w-lg rounded-2xl border-dashed">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>Log in to view your dashboard metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-xl">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (user.role === "admin" && adminData) {
    const chartData = adminData.salesByDay.map((d) => ({
      date: d.date.slice(5),
      amount: d.amount,
    }));
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform-wide overview</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total products"
            value={String(adminData.totals.products)}
            icon={Package}
            loading={loading}
          />
          <StatCard
            title="Total orders"
            value={String(adminData.totals.orders)}
            icon={ShoppingCart}
            loading={loading}
          />
          <StatCard
            title="Revenue"
            value={`ETB ${adminData.totals.revenue.toLocaleString()}`}
            icon={Banknote}
            loading={loading}
          />
        </div>
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Sales trend</CardTitle>
            <CardDescription>Last 14 days (paid + completed)</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="fillAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142 71% 35%)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(142 71% 35%)" stopOpacity={0} />
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
                  stroke="hsl(142 71% 35%)"
                  fill="url(#fillAmt)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest activity across the platform</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminData.recentOrders.map((r) => (
                  <TableRow key={r.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="font-medium">{r.productTitle}</TableCell>
                    <TableCell>{r.buyerName}</TableCell>
                    <TableCell>{r.sellerName}</TableCell>
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

  if (user.role === "seller" && sellerInsights) {
    const myOrders = orders.filter((o) => o.sellerId === user.id).slice(0, 10);
    const chartData = sellerInsights.revenueByDay.map((d) => ({
      date: d.date.slice(5),
      amount: d.revenue,
    }));
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your shop performance</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Products" value={String(productTotal)} icon={Package} loading={loading} />
          <StatCard
            title="Orders (you)"
            value={String(orders.filter((o) => o.sellerId === user.id).length)}
            icon={ShoppingCart}
            loading={loading}
          />
          <StatCard
            title="Revenue (completed)"
            value={`ETB ${sellerInsights.summary.revenueCompleted.toLocaleString()}`}
            icon={Banknote}
            loading={loading}
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

  /* Buyer */
  const buyerOrders = orders.filter((o) => o.buyerId === user.id);
  const spent = buyerOrders.reduce((s, o) => s + o.totalPrice, 0);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your buyer activity</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Your orders" value={String(buyerOrders.length)} icon={ShoppingCart} loading={loading} />
        <StatCard title="Total spent" value={`ETB ${spent.toLocaleString()}`} icon={Banknote} loading={loading} />
        <StatCard title="Products" value="—" icon={Package} loading={loading} />
      </div>
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
        Selling on EthioLocal? Ask an admin to upgrade your account to <strong>seller</strong>.
      </p>
    </div>
  );
}
