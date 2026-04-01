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
import { fetchAdminDashboard, toastApiError, type AdminDashboard } from "@/lib/api";
import { Banknote, Package, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

export function AdminHomeClient() {
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    if (!user?.id || user.role !== "admin") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const d = await fetchAdminDashboard();
        if (!cancelled) setAdminData(d);
      } catch (e) {
        if (!cancelled) toast.error(toastApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  if (!user) return null;
  if (loading) return <DashboardSkeleton />;
  if (!adminData) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load admin dashboard. Ensure you have admin access.
      </p>
    );
  }

  const chartData = adminData.salesByDay.map((d) => ({
    date: d.date.slice(5),
    amount: d.amount,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground">Users, commission flows, and platform analytics</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total products" value={String(adminData.totals.products)} icon={Package} />
        <StatCard title="Total orders" value={String(adminData.totals.orders)} icon={ShoppingCart} />
        <StatCard title="Revenue" value={`ETB ${adminData.totals.revenue.toLocaleString()}`} icon={Banknote} />
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
