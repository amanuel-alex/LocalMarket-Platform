"use client";

import { motion } from "framer-motion";
import { MapPin, PackageOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DeliveryAssignmentBadge } from "@/components/delivery/delivery-assignment-badge";
import { Button } from "@/components/ui/button";
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
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

export function DeliveryAssignmentsClient() {
  const [rows, setRows] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const list = await fetchDeliveryAssignments();
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
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">EthioLocal</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Assignments</h1>
        <p className="text-sm text-muted-foreground">
          Orders assigned to you — pickup coordinates, contacts, and QR handoff.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted shadow-inner">
              <PackageOpen className="size-7 text-muted-foreground" />
            </div>
            <p className="font-medium">No assignments</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Admins assign deliveries by setting <span className="font-mono text-xs">deliveryAgentId</span> on
              an order. Once linked to your agent account, jobs appear here automatically.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Product</TableHead>
                    <TableHead>Order status</TableHead>
                    <TableHead>Run</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((a) => (
                    <TableRow key={a.id} className="transition-colors hover:bg-muted/40">
                      <TableCell className="font-medium">{a.product.title}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={a.status} />
                      </TableCell>
                      <TableCell>
                        <DeliveryAssignmentBadge assignment={a} />
                      </TableCell>
                      <TableCell className="text-right">ETB {a.totalPrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="rounded-lg" asChild>
                          <Link href={`/delivery/assignments/${a.id}`}>Details</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="divide-y divide-border/60 md:hidden">
              {rows.map((a) => (
                <li key={a.id} className="p-4">
                  <div className="flex gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {a.product.imageUrl ? (
                        <Image src={a.product.imageUrl} alt="" fill className="object-cover" sizes="64px" unoptimized />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <MapPin className="size-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">{a.product.title}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <OrderStatusBadge status={a.status} />
                        <DeliveryAssignmentBadge assignment={a} />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">ETB {a.totalPrice.toLocaleString()}</p>
                      <Button className="mt-3 w-full rounded-xl" size="sm" asChild>
                        <Link href={`/delivery/assignments/${a.id}`}>Open details</Link>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </motion.div>
    </div>
  );
}
