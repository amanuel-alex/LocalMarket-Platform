"use client";

import { motion } from "framer-motion";
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
import { useMemo, useState } from "react";

import { DashboardSkeleton, StatCard } from "@/components/dashboard/dashboard-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Banknote, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { useEffect } from "react";

type SortKey = "createdAt" | "totalPrice" | "status" | "productTitle";

export function AdminHomeClient() {
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminDashboard | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tableQuery, setTableQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

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

  const processedOrders = useMemo(() => {
    if (!adminData) return [];
    let rows = [...adminData.recentOrders];
    if (statusFilter !== "all") {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    const q = tableQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.productTitle.toLowerCase().includes(q) ||
          r.buyerName.toLowerCase().includes(q) ||
          r.sellerName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q),
      );
    }
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === "totalPrice") {
        cmp = a.totalPrice - b.totalPrice;
      } else if (sortKey === "status") {
        cmp = a.status.localeCompare(b.status);
      } else {
        cmp = a.productTitle.localeCompare(b.productTitle);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [adminData, statusFilter, tableQuery, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
  }

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
        <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform health, revenue, and recent commerce activity
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Products" value={String(adminData.totals.products)} icon={Package} />
        <StatCard title="Orders" value={String(adminData.totals.orders)} icon={ShoppingCart} />
        <StatCard
          title="Revenue (paid + completed)"
          value={`ETB ${adminData.totals.revenue.toLocaleString()}`}
          icon={Banknote}
        />
        <StatCard
          title="Active users (30d)"
          value={String(adminData.totals.activeUsersLast30Days)}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Sales trend</CardTitle>
            <CardDescription>Gross order value per day · last 14 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="adminSalesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={0.25} />
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
                  fill="url(#adminSalesFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-muted-foreground" />
              Top products
            </CardTitle>
            <CardDescription>By order volume (all time)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminData.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              adminData.topProducts.map((p, i) => (
                <motion.div
                  key={p.productId}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start justify-between gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.orderCount} orders · {p.unitsSold} units
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Latest 50 orders · filter, search, and sort client-side</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Input
              placeholder="Search product, buyer, seller, id…"
              value={tableQuery}
              onChange={(e) => setTableQuery(e.target.value)}
              className="h-10 max-w-md rounded-xl"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="paid">paid</SelectItem>
                <SelectItem value="completed">completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 font-medium"
                    onClick={() => toggleSort("productTitle")}
                  >
                    Product {sortKey === "productTitle" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </Button>
                </TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 font-medium"
                    onClick={() => toggleSort("status")}
                  >
                    Status {sortKey === "status" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-mr-2 ml-auto h-8 font-medium"
                    onClick={() => toggleSort("totalPrice")}
                  >
                    Total {sortKey === "totalPrice" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 font-medium"
                    onClick={() => toggleSort("createdAt")}
                  >
                    Date {sortKey === "createdAt" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No orders match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                processedOrders.map((r) => (
                  <TableRow key={r.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="max-w-[200px] truncate font-medium">{r.productTitle}</TableCell>
                    <TableCell>{r.buyerName}</TableCell>
                    <TableCell>{r.sellerName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-lg capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">ETB {r.totalPrice.toLocaleString()}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
