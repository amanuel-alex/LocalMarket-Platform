"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  assignAdminProductGroup,
  createAdminProductGroup,
  fetchAdminCategoryStats,
  fetchAdminProducts,
  toastApiError,
  type ProductRow,
} from "@/lib/api";
import { ImageIcon, Layers, Package } from "lucide-react";

export function AdminProductsClient() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupLabel, setGroupLabel] = useState("");
  const [assignPid, setAssignPid] = useState("");
  const [assignGid, setAssignGid] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        fetchAdminProducts({
          limit: 80,
          offset: 0,
          q: qDebounced || undefined,
          category: category.trim() || undefined,
        }),
        fetchAdminCategoryStats(),
      ]);
      setProducts(p.products);
      setTotal(p.total);
      setCategories(c.slice(0, 12));
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setLoading(false);
    }
  }, [qDebounced, category]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function onCreateGroup() {
    try {
      const g = await createAdminProductGroup(groupLabel.trim() || undefined);
      toast.success(`Group created · ${g.id.slice(0, 8)}…`);
      setGroupLabel("");
      setGroupOpen(false);
    } catch (e) {
      toast.error(toastApiError(e));
    }
  }

  async function onAssignGroup() {
    if (!assignPid.trim() || !assignGid.trim()) {
      toast.error("Enter product ID and product group ID");
      return;
    }
    try {
      await assignAdminProductGroup(assignPid.trim(), assignGid.trim());
      toast.success("Product group assigned");
      setAssignPid("");
      setAssignGid("");
      await loadProducts();
    } catch (e) {
      toast.error(toastApiError(e));
    }
  }

  const chartData = categories.map((x) => ({
    name: x.category.length > 14 ? `${x.category.slice(0, 12)}…` : x.category,
    count: x.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Products & content</h1>
        <p className="text-sm text-muted-foreground">
          Catalog overview, category mix, and product-group tooling. Homepage banners & featured slots are planned —
          use groups for compare/merchandising today.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="size-4" />
              Merchandising
            </CardTitle>
            <CardDescription>Create a product group, then assign listings for price compare.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
              <DialogTrigger asChild>
                <Button type="button" className="rounded-xl">
                  New product group
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Create product group</DialogTitle>
                  <DialogDescription>Optional label for internal reference.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="gl">Label</Label>
                  <Input
                    id="gl"
                    value={groupLabel}
                    onChange={(e) => setGroupLabel(e.target.value)}
                    placeholder="e.g. Coffee 500g"
                    className="rounded-xl"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" className="rounded-xl" onClick={() => void onCreateGroup()}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
              <div className="grid flex-1 gap-2">
                <Label className="text-xs text-muted-foreground">Product ID</Label>
                <Input
                  value={assignPid}
                  onChange={(e) => setAssignPid(e.target.value)}
                  placeholder="cuid…"
                  className="rounded-xl font-mono text-xs"
                />
              </div>
              <div className="grid flex-1 gap-2">
                <Label className="text-xs text-muted-foreground">Group ID</Label>
                <Input
                  value={assignGid}
                  onChange={(e) => setAssignGid(e.target.value)}
                  placeholder="cuid…"
                  className="rounded-xl font-mono text-xs"
                />
              </div>
              <Button type="button" variant="secondary" className="rounded-xl" onClick={() => void onAssignGroup()}>
                Assign
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-dashed border-border/80 bg-muted/10 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Homepage banners & featured</CardTitle>
            <CardDescription>
              Not stored in the API yet. Next step: dedicated `Banner` and `FeaturedProduct` models + admin CRUD.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Products by category</CardTitle>
          <CardDescription>Top categories by live listing count</CardDescription>
        </CardHeader>
        <CardContent className="h-64 pl-0">
          {chartData.length === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">No categories yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
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
                <Bar dataKey="count" fill="hsl(221 83% 53%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search title, description, category…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md rounded-xl"
          />
          <Input
            placeholder="Filter exact category name…"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="max-w-xs rounded-xl"
          />
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void loadProducts()}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Group</TableHead>
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
              : products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt="" className="size-9 rounded-xl object-cover" />
                          ) : (
                            <ImageIcon className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.title}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{p.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell className="font-mono text-xs">{p.sellerId.slice(0, 10)}…</TableCell>
                    <TableCell className="text-right">ETB {p.price.toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.productGroupId ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </motion.div>

      {!loading && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 py-16 text-center">
          <Package className="mb-3 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No products match filters · {total} total in catalog</p>
        </div>
      ) : null}
    </div>
  );
}
