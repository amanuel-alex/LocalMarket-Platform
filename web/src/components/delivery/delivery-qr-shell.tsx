"use client";

import { motion } from "framer-motion";
import { QrCode, ShieldCheck, Truck } from "lucide-react";

import { QrVerifyClient } from "@/app/(dashboard)/qr-verify/qr-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DeliveryQrShell() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">EthioLocal</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">QR verification</h1>
        <p className="text-sm text-muted-foreground">
          Scan the buyer’s pickup QR with your camera or paste the token. You must be <strong>assigned</strong> to
          the order — the API enforces this for your agent account.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-4 text-cyan-600" />
              Field workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-4">
              <li>Confirm you are on the assigned order in Assignments.</li>
              <li>Collect the item and meet the buyer.</li>
              <li>Scan their EthioLocal QR with the camera, or paste the token if needed.</li>
            </ol>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-emerald-600" />
              Security
            </CardTitle>
            <CardDescription>Scoped to your assignments</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tokens match a single order. If you are not the assigned agent, verification is rejected.
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="size-4 text-cyan-600" />
            Scan or enter token
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QrVerifyClient embedded enableCameraScanner />
        </CardContent>
      </Card>
    </div>
  );
}
