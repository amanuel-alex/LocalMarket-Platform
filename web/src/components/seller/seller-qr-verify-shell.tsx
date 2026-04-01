"use client";

import { motion } from "framer-motion";
import { QrCode, ShieldCheck } from "lucide-react";

import { QrVerifyClient } from "@/app/(dashboard)/qr-verify/qr-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SellerQrVerifyShell() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-violet-600">EthioLocal</p>
        <h1 className="text-2xl font-semibold tracking-tight">QR verification</h1>
        <p className="text-sm text-muted-foreground">
          Confirm in-store pickup: only orders for <strong>your</strong> products can be validated with your
          seller account. Invalid or foreign tokens are rejected by the server.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="size-4 text-violet-600" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-4">
              <li>Buyer shows their pickup QR after payment.</li>
              <li>Paste the long token from the QR into the field below.</li>
              <li>Success updates the order — you will see a green confirmation.</li>
            </ol>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-emerald-600" />
              Security
            </CardTitle>
            <CardDescription>Scoped to your catalog</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tokens are tied to specific orders. You cannot complete another seller’s sale — the API enforces
            ownership so mistakes are caught early.
          </CardContent>
        </Card>
      </div>

      <QrVerifyClient />
    </div>
  );
}
