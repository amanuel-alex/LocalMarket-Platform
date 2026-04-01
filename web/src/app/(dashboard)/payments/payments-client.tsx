"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
import { fetchAdminPayments, toastApiError, type AdminPayment } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Banknote } from "lucide-react";

function PayBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let tone = "border-border bg-muted text-muted-foreground";
  if (s === "completed") tone = "border-emerald-200 bg-emerald-50 text-emerald-900";
  else if (s === "pending") tone = "border-amber-200 bg-amber-50 text-amber-900";
  else if (s === "failed") tone = "border-red-200 bg-red-50 text-red-900";
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", tone)}>
      {status}
    </span>
  );
}

export function PaymentsClient() {
  return <PaymentsInner />;
}

function PaymentsInner() {
  const [rows, setRows] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const d = await fetchAdminPayments(100, 0);
        if (!c) {
          setRows(d.payments);
          setTotal(d.total);
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

  const summary = useMemo(() => {
    const completed = rows.filter((p) => p.status === "completed");
    const sum = completed.reduce((a, p) => a + p.amount, 0);
    return { count: completed.length, volume: sum };
  }, [rows]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">Platform payment history</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div whileHover={{ scale: 1.01 }}>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Completed (this page)</CardDescription>
              <CardTitle className="text-2xl">{loading ? "—" : summary.count}</CardTitle>
            </CardHeader>
            <CardContent>
              <Banknote className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ scale: 1.01 }} className="sm:col-span-2">
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Volume (completed on page)</CardDescription>
              <CardTitle className="text-2xl">
                {loading ? <Skeleton className="h-8 w-40" /> : `ETB ${summary.volume.toLocaleString()}`}
              </CardTitle>
            </CardHeader>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.map((p) => (
                  <TableRow key={p.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">{p.id.slice(0, 12)}…</TableCell>
                    <TableCell className="font-mono text-xs">{p.orderId.slice(0, 12)}…</TableCell>
                    <TableCell>
                      <PayBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right">ETB {p.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {new Date(p.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </motion.div>
      <p className="text-xs text-muted-foreground">Total records in DB: {total}</p>
    </div>
  );
}
