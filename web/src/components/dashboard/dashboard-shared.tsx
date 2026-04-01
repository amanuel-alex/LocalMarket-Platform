"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OrderRow } from "@/lib/api";

export function ordersByDay(orders: OrderRow[], days: number): { date: string; amount: number }[] {
  const amounts = new Map<string, number>();
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  for (const o of orders) {
    const d = new Date(o.createdAt);
    if (d < start) continue;
    const key = d.toISOString().slice(0, 10);
    amounts.set(key, (amounts.get(key) ?? 0) + o.totalPrice);
  }
  const out: { date: string; amount: number }[] = [];
  for (let i = 0; i < days; i++) {
    const dt = new Date(start);
    dt.setUTCDate(start.getUTCDate() + i);
    const key = dt.toISOString().slice(0, 10);
    out.push({ date: key, amount: amounts.get(key) ?? 0 });
  }
  return out;
}

export function DashboardSkeleton() {
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

export function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
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
