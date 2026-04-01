"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
import {
  fetchAdminMetricsSummary,
  fetchAdminSystemAnalytics,
  toastApiError,
  type HttpMetricsSummary,
  type SystemAnalytics,
} from "@/lib/api";
import { Activity, BarChart3, ShoppingBag } from "lucide-react";

export function AdminAnalyticsClient() {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [metrics, setMetrics] = useState<HttpMetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      try {
        const [a, m] = await Promise.all([fetchAdminSystemAnalytics(), fetchAdminMetricsSummary(24)]);
        if (!c) {
          setAnalytics(a);
          setMetrics(m);
        }
      } catch (e) {
        if (!c) toast.error(toastApiError(e));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const popChart =
    analytics?.popularProducts.slice(0, 8).map((p) => ({
      name: p.title.length > 16 ? `${p.title.slice(0, 14)}…` : p.title,
      orders: p.orderCount,
    })) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Commerce signals and HTTP health from persisted logs</p>
      </div>

      {loading || !analytics || !metrics ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ShoppingBag className="size-4" />
                  GMV (paid + completed)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">ETB {analytics.totalSales.toLocaleString()}</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BarChart3 className="size-4" />
                  Active participants (30d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{analytics.activeUsersLast30Days}</p>
                <p className="text-xs text-muted-foreground">Buyers & sellers with recent orders</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Activity className="size-4" />
                  API health (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {metrics.totalRequests > 0
                    ? `${(metrics.serverErrorRate * 100).toFixed(2)}%`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalRequests} requests · avg {metrics.avgDurationMs} ms
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Popular products</CardTitle>
          <CardDescription>Order frequency across the catalog</CardDescription>
        </CardHeader>
        <CardContent className="h-72 pl-0">
          {popChart.length === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">Not enough data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popChart} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-24} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Bar dataKey="orders" fill="hsl(142 71% 36%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {analytics ? (
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>Detailed rows</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.popularProducts.map((p) => (
                  <TableRow key={p.productId}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-right">{p.orderCount}</TableCell>
                    <TableCell className="text-right">{p.unitsSold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
