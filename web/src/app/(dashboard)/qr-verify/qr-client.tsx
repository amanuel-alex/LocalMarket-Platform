"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getStoredUser } from "@/lib/auth-storage";
import { normalizeRole } from "@/lib/roles";
import { toastApiError, verifyQrToken } from "@/lib/api";
import { CheckCircle2, XCircle } from "lucide-react";

const DeliveryQrCameraScanner = dynamic(
  () =>
    import("@/components/delivery/delivery-qr-camera-scanner").then((mod) => mod.DeliveryQrCameraScanner),
  {
    ssr: false,
    loading: () => <Skeleton className="mx-auto h-[220px] max-w-sm rounded-2xl" />,
  },
);

export function QrVerifyClient({
  embedded = false,
  enableCameraScanner = false,
}: { embedded?: boolean; enableCameraScanner?: boolean } = {}) {
  const user = getStoredUser();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<{ id: string; status: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function verifyWith(tRaw: string) {
    const t = tRaw.trim();
    if (t.length < 32) {
      toast.error("Token looks too short");
      return;
    }
    setLoading(true);
    setOk(null);
    setErr(null);
    try {
      const order = await verifyQrToken(t);
      setOk({ id: order.id, status: order.status });
      toast.success("Pickup verified");
    } catch (e) {
      const msg = toastApiError(e);
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onVerify() {
    await verifyWith(token);
  }

  if (!user) {
    return <p className="text-sm text-muted-foreground">Sign in to verify pickup QR codes.</p>;
  }

  const r = normalizeRole(user.role);
  if (r !== "seller" && r !== "delivery") {
    return (
      <p className="text-sm text-muted-foreground">
        QR verification is available for <strong>seller</strong> and <strong>delivery</strong> roles.
      </p>
    );
  }

  const isDelivery = r === "delivery";

  return (
    <div className={embedded ? "mx-auto max-w-xl space-y-6" : "mx-auto max-w-xl space-y-8"}>
      {!embedded ? (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">QR verification</h1>
          <p className="text-sm text-muted-foreground">
            {isDelivery
              ? "Confirm handoff by entering the pickup token from the buyer’s QR code."
              : "Enter the pickup token from the buyer’s QR code (in-store pickup)."}
          </p>
        </div>
      ) : null}

      {enableCameraScanner ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-cyan-200/60 bg-cyan-50/20 p-4 shadow-sm dark:border-cyan-900/40 dark:bg-cyan-950/15 sm:p-6"
        >
          <p className="mb-3 text-center text-sm font-medium text-foreground">Scan with camera</p>
          <DeliveryQrCameraScanner
            disabled={loading}
            onScan={(text) => {
              setToken(text);
              void verifyWith(text);
            }}
          />
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
      >
        {enableCameraScanner ? (
          <p className="text-center text-xs font-medium text-muted-foreground">Or paste the token manually</p>
        ) : null}
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste token here…"
          className="h-14 rounded-2xl border-2 text-base shadow-inner"
          autoComplete="off"
        />
        <Button
          type="button"
          className="h-12 w-full rounded-2xl text-base shadow-sm"
          disabled={loading}
          onClick={() => void onVerify()}
        >
          {loading ? "Verifying…" : "Verify pickup"}
        </Button>
      </motion.div>

      {ok ? (
        <Alert className="rounded-2xl border-emerald-200 bg-emerald-50/80">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Order <span className="font-mono text-xs">{ok.id}</span> — status{" "}
            <strong>{ok.status}</strong>
          </AlertDescription>
        </Alert>
      ) : null}

      {err ? (
        <Alert variant="destructive" className="rounded-2xl">
          <XCircle className="size-4" />
          <AlertTitle>Could not verify</AlertTitle>
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
