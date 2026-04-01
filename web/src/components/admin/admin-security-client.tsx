"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminOverrideOrder,
  fetchAdminErrorLogs,
  fetchAdminRequestLogs,
  toastApiError,
  type AdminErrorLogItem,
  type AdminRequestLogItem,
} from "@/lib/api";
import { ShieldAlert } from "lucide-react";

export function AdminSecurityClient() {
  const [errors, setErrors] = useState<AdminErrorLogItem[]>([]);
  const [requests, setRequests] = useState<AdminRequestLogItem[]>([]);
  const [loadingE, setLoadingE] = useState(true);
  const [loadingR, setLoadingR] = useState(true);

  const [orderId, setOrderId] = useState("");
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [clearQr, setClearQr] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [overrideBusy, setOverrideBusy] = useState(false);

  const loadErrors = useCallback(async () => {
    setLoadingE(true);
    try {
      const d = await fetchAdminErrorLogs(40, 0);
      setErrors(d.items);
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setLoadingE(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoadingR(true);
    try {
      const d = await fetchAdminRequestLogs(40, 0);
      setRequests(d.items);
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setLoadingR(false);
    }
  }, []);

  useEffect(() => {
    void loadErrors();
    void loadRequests();
  }, [loadErrors, loadRequests]);

  async function submitOverride() {
    const id = orderId.trim();
    if (!id) {
      toast.error("Order ID required");
      return;
    }
    const body: { status?: string; clearPickupQr?: boolean; adminNote?: string } = {};
    if (orderStatus) body.status = orderStatus;
    if (clearQr) body.clearPickupQr = true;
    if (adminNote.trim()) body.adminNote = adminNote.trim();
    if (Object.keys(body).length === 0) {
      toast.error("Choose status, clear QR, or add a note");
      return;
    }
    setOverrideBusy(true);
    try {
      await adminOverrideOrder(id, body);
      toast.success("Order updated");
      setOrderId("");
      setOrderStatus("");
      setClearQr(false);
      setAdminNote("");
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setOverrideBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldAlert className="size-7 text-amber-600 dark:text-amber-400" />
          Fraud & security
        </h1>
        <p className="text-sm text-muted-foreground">
          Review server errors and slow paths, then apply controlled order overrides when investigating abuse.
        </p>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Manual order override</CardTitle>
          <CardDescription>
            Use for disputes and investigations. Prefer the disputes workflow when a buyer opened a case.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="oid">Order ID</Label>
            <Input
              id="oid"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="cuid…"
              className="rounded-xl font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Set status (optional)</Label>
            <Select value={orderStatus || "none"} onValueChange={(v) => setOrderStatus(v === "none" ? "" : v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="No change" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none">No change</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="paid">paid</SelectItem>
                <SelectItem value="completed">completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Clear pickup QR</p>
              <p className="text-xs text-muted-foreground">Regenerates eligibility for a new token path</p>
            </div>
            <Switch checked={clearQr} onCheckedChange={setClearQr} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">Admin note (optional)</Label>
            <Textarea
              id="note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Internal audit trail…"
              className="min-h-[88px] rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="button"
              className="rounded-xl"
              disabled={overrideBusy}
              onClick={() => void submitOverride()}
            >
              {overrideBusy ? "Applying…" : "Apply override"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList className="rounded-xl bg-muted/80 p-1">
          <TabsTrigger value="errors" className="rounded-lg">
            Error logs
          </TabsTrigger>
          <TabsTrigger value="requests" className="rounded-lg">
            Request logs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="errors">
          <div className="mb-2 flex justify-end">
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => void loadErrors()}>
              Refresh
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingE
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={4}>
                          <Skeleton className="h-10 w-full rounded-lg" />
                        </TableCell>
                      </TableRow>
                    ))
                  : errors.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(e.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-md truncate text-sm">{e.message}</TableCell>
                        <TableCell className="font-mono text-xs">{e.path ?? "—"}</TableCell>
                        <TableCell className="text-xs">{e.code ?? "—"}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          {!loadingE && errors.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No errors recorded.</p>
          ) : null}
        </TabsContent>
        <TabsContent value="requests">
          <div className="mb-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => void loadRequests()}
            >
              Refresh
            </Button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">ms</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingR
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-10 w-full rounded-lg" />
                        </TableCell>
                      </TableRow>
                    ))
                  : requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.method}</TableCell>
                        <TableCell className="max-w-[200px] truncate font-mono text-xs">{r.path}</TableCell>
                        <TableCell>
                          <span
                            className={
                              r.statusCode >= 500
                                ? "text-destructive"
                                : r.statusCode >= 400
                                  ? "text-amber-600"
                                  : ""
                            }
                          >
                            {r.statusCode}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs">{r.durationMs}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          {!loadingR && requests.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No request logs yet.</p>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
