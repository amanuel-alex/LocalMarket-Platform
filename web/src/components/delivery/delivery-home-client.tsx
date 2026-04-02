"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, Package, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DeliveryAssignmentBadge, getDeliveryRunStatus } from "@/components/delivery/delivery-assignment-status";
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
import { fetchOrders, toastApiError, type OrderRow } from "@/lib/api";
import { normalizeRole } from "@/lib/roles";

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function DeliveryHomeClient() {
  const user = getStoredUser();
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (normalizeRole(user?.role) !== "delivery") {
      setLoading(false);
      return;
    }
    let c = false;
    (async () => {
      try {
        const list = await fetchOrders();
        if (!c) setRows(list);
      } catch (e) {
        if (!c) toast.error(toastApiError(e));
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [user?.role]);

  const stats = useMemo(() => {
    const today = rows.filter((o) => isToday(o.createdAt));
    const pending = rows.filter((o) => getDeliveryRunStatus(o) === "pending");
    const inProg = rows.filter((o) => getDeliveryRunStatus(o) === "in_progress");
    const done = rows.filter((o) => getDeliveryRunStatus(o) === "completed");
    return {
      todayCount: today.length,
      pending: pending.length,
      inProgress: inProg.length,
      completed: done.length,
    };
  }, [rows]);

  const quick = rows.filter((o) => {
    const k = getDeliveryRunStatus(o);
    return k === "pending" || k === "in_progress";
  }).slice(0, 5);

  if (!user || normalizeRole(user.role) !== "delivery") return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          EthioLocal
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Delivery dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Assigned runs, handoffs, and QR verification. Admins assign orders to your account — then you start the run
          and confirm pickup with the buyer’s code.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
            <Card className="rounded-2xl border-border/60 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>Today (created)</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{stats.todayCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <Package className="size-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
            <Card className="rounded-2xl border-amber-200/60 bg-amber-50/30 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <CardDescription>Pending start</CardDescription>
                <CardTitle className="text-2xl tabular-nums text-amber-950 dark:text-amber-100">
                  {stats.pending}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Clock className="size-5 text-amber-700 dark:text-amber-300" />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
            <Card className="rounded-2xl border-sky-200/60 bg-sky-50/30 shadow-sm dark:border-sky-900/40 dark:bg-sky-950/20">
              <CardHeader className="pb-2">
                <CardDescription>In progress</CardDescription>
                <CardTitle className="text-2xl tabular-nums text-sky-950 dark:text-sky-100">
                  {stats.inProgress}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Truck className="size-5 text-sky-700 dark:text-sky-300" />
              </CardContent>
            </Card>
          </motion.div>
          <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}>
            <Card className="rounded-2xl border-emerald-200/60 bg-emerald-50/30 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
                <CardTitle className="text-2xl tabular-nums text-emerald-950 dark:text-emerald-100">
                  {stats.completed}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CheckCircle2 className="size-5 text-emerald-700 dark:text-emerald-300" />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild className="rounded-xl shadow-sm">
          <Link href="/delivery/assignments">
            All assignments
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/delivery/qr-verify">QR verification</Link>
        </Button>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Quick access</CardTitle>
          <CardDescription>Active assignments — tap a row for maps and contacts.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 sm:px-6">
          {loading ? (
            <div className="space-y-2 px-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : quick.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No active assignments. When an admin assigns orders to you, they appear here and under Assignments.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {quick.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{o.product.title}</TableCell>
                    <TableCell>
                      <DeliveryAssignmentBadge order={o} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="rounded-lg" asChild>
                        <Link href={`/delivery/assignments/${o.id}`}>Open</Link>
                      </Button>
                    </TableCell>
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
