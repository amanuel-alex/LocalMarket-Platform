"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminUsers, toastApiError, type AdminUser } from "@/lib/api";
import Link from "next/link";

export function AdminSellersClient() {
  const [sellers, setSellers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");

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
        role: "seller",
        q: qDebounced || undefined,
      });
      setSellers(d.users);
      setTotal(d.total);
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setLoading(false);
    }
  }, [qDebounced]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sellers</h1>
        <p className="text-sm text-muted-foreground">
          Organizer accounts · approve by activating suspended sellers or promote from{" "}
          <Link href="/admin/users" className="font-medium text-primary underline-offset-4 hover:underline">
            Users
          </Link>
          . {total} seller{total === 1 ? "" : "s"} match filters.
        </p>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardContent className="p-4">
          <Input
            placeholder="Search seller name or phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-md rounded-xl"
          />
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
              <TableHead>Seller</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              : sellers.map((s) => {
                  const active = s.bannedAt == null;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.phone}</TableCell>
                      <TableCell>
                        {active ? (
                          <Badge className="rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="rounded-lg">
                            Suspended
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm" className="rounded-xl">
                          <Link href={`/admin/users?q=${encodeURIComponent(s.phone)}`}>Manage in Users</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>
      </motion.div>

      {!loading && sellers.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No sellers match your search.</p>
      ) : null}
    </div>
  );
}
