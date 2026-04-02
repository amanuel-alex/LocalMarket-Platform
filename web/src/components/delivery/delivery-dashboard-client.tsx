"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, Package, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DeliveryAssignmentBadge, deliveryAssignmentLabel } from "@/components/delivery/delivery-assignment-badge";
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
import { fetchDeliveryAssignments, toastApiError, type DeliveryAssignment } from "@/lib/api";

function startOfTodayUtc() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

export function DeliveryDashboardClient() {
  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const list = await fetchDeliveryAssignments();
        if (!c) setAssignments(list);
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

  const stats = useMemo(() => {
    const t0 = startOfTodayUtc();
    const todayCount = assignments.filter((a) => new Date(a.createdAt).getTime() >= t0).length;
    const pending = assignments.filter((a) => {
      const { key } = deliveryAssignmentLabel(a);
      return key === "pending";
    }).length;
    const inProgress = assignments.filter((a) => deliveryAssignmentLabel(a).key === "in_progress").length;
    const completed = assignments.filter((a) => a.status === "completed").length;
    return { todayCount, pending, inProgress, completed };
  }, [assignments]);

  const quick = assignments.slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">EthioLocal</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Delivery dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Today’s runs, active jobs, and quick access to assignments. Optimized for mobile in the field.
        </p>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Today’s jobs", value: stats.todayCount, icon: Truck, sub: "Created today (UTC)" },
          { title: "Pending", value: stats.pending, icon: Clock, sub: "Paid, not started" },
          { title: "In progress", value: stats.inProgress, icon: Package, sub: "On the road" },
          { title: "Completed", value: stats.completed, icon: CheckCircle2, sub: "All time" },
        ].map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="rounded-2xl border-border/60 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
                <s.icon className="size-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-12 rounded-lg" />
                ) : (
                  <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
                )}
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Quick access</CardTitle>
            <CardDescription>Latest assignments — open for maps and handoff</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full rounded-xl sm:w-auto">
            <Link href="/delivery/assignments">
              All assignments
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {loading ? (
            <div className="space-y-3 px-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : quick.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No assignments yet. When an admin assigns orders to your account, they will show here.
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quick.map((a) => (
                      <TableRow key={a.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{a.product.title}</TableCell>
                        <TableCell>
                          <DeliveryAssignmentBadge assignment={a} />
                        </TableCell>
                        <TableCell className="text-right">ETB {a.totalPrice.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="rounded-lg" asChild>
                            <Link href={`/delivery/assignments/${a.id}`}>Open</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ul className="divide-y divide-border/60 md:hidden">
                {quick.map((a) => (
                  <li key={a.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium leading-snug">{a.product.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">ETB {a.totalPrice.toLocaleString()}</p>
                        <div className="mt-2">
                          <DeliveryAssignmentBadge assignment={a} />
                        </div>
                      </div>
                      <Button size="sm" className="shrink-0 rounded-xl" asChild>
                        <Link href={`/delivery/assignments/${a.id}`}>Open</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
