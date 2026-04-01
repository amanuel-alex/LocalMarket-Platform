"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  fetchAdminPayments,
  fetchAdminPayouts,
  fetchAdminSettings,
  fetchAdminSystemAnalytics,
  patchAdminCommission,
  postAdminPayoutCancel,
  postAdminPayoutMarkPaid,
  toastApiError,
  type AdminPayment,
  type AdminPayoutRow,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { Banknote, Percent, Wallet } from "lucide-react";

function PayBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let tone = "border-border bg-muted text-muted-foreground";
  if (s === "completed" || s === "paid") tone = "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100";
  else if (s === "pending") tone = "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100";
  else if (s === "failed" || s === "cancelled") tone = "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100";
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", tone)}>
      {status}
    </span>
  );
}

export function AdminFinanceClient() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [payTotal, setPayTotal] = useState(0);
  const [payouts, setPayouts] = useState<AdminPayoutRow[]>([]);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const [gmv, setGmv] = useState<number | null>(null);
  const [commissionBps, setCommissionBps] = useState<number | null>(null);
  const [commissionInput, setCommissionInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingCommission, setSavingCommission] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pay, po, settings, analytics] = await Promise.all([
        fetchAdminPayments(80, 0),
        fetchAdminPayouts(80, 0),
        fetchAdminSettings(),
        fetchAdminSystemAnalytics(),
      ]);
      setPayments(pay.payments);
      setPayTotal(pay.total);
      setPayouts(po.payouts);
      setPayoutTotal(po.total);
      setGmv(analytics.totalSales);
      setCommissionBps(settings.commissionRateBps);
      setCommissionInput(String(settings.commissionRateBps / 100));
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const payVolume = useMemo(() => {
    const completed = payments.filter((p) => p.status === "completed");
    return completed.reduce((a, p) => a + p.amount, 0);
  }, [payments]);

  async function saveCommission() {
    const pct = Number(commissionInput);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Enter a percentage between 0 and 100");
      return;
    }
    const bps = Math.round(pct * 100);
    setSavingCommission(true);
    try {
      const s = await patchAdminCommission(bps);
      setCommissionBps(s.commissionRateBps);
      setCommissionInput(String(s.commissionRateBps / 100));
      toast.success("Commission rate updated");
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setSavingCommission(false);
    }
  }

  async function markPaid(p: AdminPayoutRow) {
    try {
      await postAdminPayoutMarkPaid(p.id);
      toast.success("Payout marked paid");
      await load();
    } catch (e) {
      toast.error(toastApiError(e));
    }
  }

  async function cancelPayout(p: AdminPayoutRow) {
    if (!confirm(`Cancel payout ${p.id.slice(0, 8)}… and return funds?`)) return;
    try {
      await postAdminPayoutCancel(p.id);
      toast.success("Payout cancelled");
      await load();
    } catch (e) {
      toast.error(toastApiError(e));
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments & financials</h1>
        <p className="text-sm text-muted-foreground">GMV, platform commission, payment ledger, and seller payouts</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Banknote className="size-4" />
                  GMV (orders)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">ETB {(gmv ?? 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Paid + completed totals</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Wallet className="size-4" />
                  Completed payments (sample)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">ETB {payVolume.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">From visible page ({payments.length} rows)</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Percent className="size-4" />
                  Platform commission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Current:{" "}
                  <span className="font-semibold text-foreground">
                    {commissionBps != null ? (commissionBps / 100).toFixed(2) : "—"}%
                  </span>{" "}
                  ({commissionBps ?? "—"} bps)
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="comm" className="text-xs">
                      New rate (%)
                    </Label>
                    <Input
                      id="comm"
                      value={commissionInput}
                      onChange={(e) => setCommissionInput(e.target.value)}
                      className="h-9 w-28 rounded-xl"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl"
                    disabled={savingCommission}
                    onClick={() => void saveCommission()}
                  >
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Seller payouts</CardTitle>
          <CardDescription>{payoutTotal} total · mark paid after bank transfer</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                : payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.userName}</p>
                          <p className="font-mono text-xs text-muted-foreground">{p.userPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>ETB {p.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <PayBadge status={p.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(p.requestedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="default"
                              className="rounded-xl"
                              onClick={() => void markPaid(p)}
                            >
                              Mark paid
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => void cancelPayout(p)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>{payTotal} platform payment records</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Order status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                : payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <PayBadge status={p.status} />
                      </TableCell>
                      <TableCell className="font-medium">ETB {p.amount.toLocaleString()}</TableCell>
                      <TableCell className="font-mono text-xs">{p.orderId}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{p.orderStatus}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
