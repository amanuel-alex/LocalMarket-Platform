"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminUsers, patchAdminUser, toastApiError, type AdminUser } from "@/lib/api";

const ROLES = ["buyer", "seller", "admin", "delivery"] as const;

export function UsersClient() {
  return <UsersInner />;
}

function UsersInner() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchAdminUsers(100, 0);
      setUsers(d.users);
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

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

  async function toggleActive(u: AdminUser, active: boolean) {
    try {
      const next = await patchAdminUser(u.id, { active });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...next } : x)));
      toast.success(active ? "User activated" : "User suspended");
    } catch (e) {
      toast.error(toastApiError(e));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">Manage roles and account status</p>
      </div>

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
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              : users.map((u) => {
                  const active = u.bannedAt == null;
                  return (
                    <TableRow key={u.id} className="transition-colors hover:bg-muted/40">
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.phone}</TableCell>
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
                        <Switch
                          checked={active}
                          onCheckedChange={(c) => void toggleActive(u, c)}
                          disabled={u.role === "admin"}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
