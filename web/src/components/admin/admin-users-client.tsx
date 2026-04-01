"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  fetchAdminUsers,
  patchAdminUser,
  postAdminBanUser,
  postAdminUnbanUser,
  toastApiError,
  type AdminUser,
} from "@/lib/api";

const ROLES = ["buyer", "seller", "admin", "delivery"] as const;

export function AdminUsersManagementClient() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(initialQ);
  const [qDebounced, setQDebounced] = useState(initialQ);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<"suspend" | "activate" | null>(null);
  const [banReason, setBanReason] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 320);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchAdminUsers({
        limit: 100,
        offset: 0,
        q: qDebounced || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
      });
      setUsers(d.users);
      setTotal(d.total);
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setLoading(false);
    }
  }, [qDebounced, roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateRole(id: string, role: string) {
    try {
      const u = await patchAdminUser(id, { role });
      setUsers((prev) => prev.map((x) => (x.id === id ? { ...x, ...u } : x)));
      toast.success("Role updated");
    } catch (e) {
      toast.error(toastApiError(e));
    }
  }

  async function applySuspend(u: AdminUser) {
    try {
      await postAdminBanUser(u.id, banReason ? { reason: banReason } : undefined);
      toast.success("User suspended");
      setConfirmUser(null);
      setConfirmAction(null);
      setBanReason("");
      await load();
    } catch (e) {
      toast.error(toastApiError(e));
    }
  }

  async function applyActivate(u: AdminUser) {
    try {
      await postAdminUnbanUser(u.id);
      toast.success("User activated");
      setConfirmUser(null);
      setConfirmAction(null);
      await load();
    } catch (e) {
      toast.error(toastApiError(e));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Search, filter by role, update roles, and suspend accounts · {total} total
        </p>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search name or phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md rounded-xl"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full rounded-xl sm:w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void load()}>
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
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
              : users.map((u) => {
                  const active = u.bannedAt == null;
                  return (
                    <TableRow key={u.id} className="transition-colors hover:bg-muted/40">
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="font-mono text-xs">{u.phone}</TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(v) => void updateRole(u.id, v)}
                        >
                          <SelectTrigger className="w-[132px] rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            active
                              ? "rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-200"
                              : "rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive"
                          }
                        >
                          {active ? "Active" : "Suspended"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {active ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              disabled={u.role === "admin"}
                              onClick={() => {
                                setConfirmUser(u);
                                setConfirmAction("suspend");
                              }}
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => {
                                setConfirmUser(u);
                                setConfirmAction("activate");
                              }}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </motion.div>

      {!loading && users.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No users match your filters.</p>
      ) : null}

      <Dialog
        open={confirmUser != null && confirmAction != null}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmUser(null);
            setConfirmAction(null);
            setBanReason("");
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "suspend" ? "Suspend user?" : "Activate user?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "suspend"
                ? "They will be signed out and blocked from the API until reactivated."
                : "Restores access for this account."}
            </DialogDescription>
          </DialogHeader>
          {confirmAction === "suspend" ? (
            <div className="space-y-2">
              <Label htmlFor="ban-reason">Reason (optional)</Label>
              <Input
                id="ban-reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Policy violation, fraud review…"
                className="rounded-xl"
              />
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setConfirmUser(null);
                setConfirmAction(null);
                setBanReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl"
              variant={confirmAction === "suspend" ? "destructive" : "default"}
              onClick={() => {
                if (!confirmUser || !confirmAction) return;
                if (confirmAction === "suspend") void applySuspend(confirmUser);
                else void applyActivate(confirmUser);
              }}
            >
              {confirmAction === "suspend" ? "Suspend" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
