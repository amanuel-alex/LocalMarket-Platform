"use client";

import { Camera, CameraOff } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onScan: (text: string) => void;
  disabled?: boolean;
};

export function DeliveryQrCameraScanner({ onScan, disabled }: Props) {
  const reactId = useId().replace(/:/g, "");
  const regionId = `delivery-qr-region-${reactId}`;
  const [active, setActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stopScanner = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) {
      setActive(false);
      return;
    }
    try {
      if (s.isScanning) {
        await s.stop();
      }
      s.clear();
    } catch {
      /* already torn down */
    }
    setActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (disabled || typeof window === "undefined") return;
    await stopScanner();

    const el = document.getElementById(regionId);
    if (el) el.innerHTML = "";

    try {
      const html5 = new Html5Qrcode(regionId, false);
      scannerRef.current = html5;

      await html5.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1,
        },
        (decodedText) => {
          if (!mountedRef.current) return;
          const t = decodedText.trim();
          if (t.length < 32) return;
          onScanRef.current(t);
          void stopScanner();
          toast.success("QR captured");
        },
        () => {
          /* per-frame decode miss — ignore */
        },
      );
      setActive(true);
    } catch (e) {
      scannerRef.current = null;
      const msg = e instanceof Error ? e.message : "Camera could not start";
      toast.error(msg);
    }
  }, [disabled, regionId, stopScanner]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="space-y-3">
      <div
        id={regionId}
        className="min-h-[220px] overflow-hidden rounded-2xl border-2 border-dashed border-cyan-200/80 bg-muted/30 dark:border-cyan-900/50 [&_video]:mx-auto [&_video]:max-h-[320px] [&_video]:w-full [&_video]:rounded-xl [&_video]:object-cover"
        aria-live="polite"
      />
      <div className="flex flex-wrap justify-center gap-2">
        {!active ? (
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl"
            disabled={disabled}
            onClick={() => void startScanner()}
          >
            <Camera className="mr-2 size-4" />
            Scan QR with camera
          </Button>
        ) : (
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void stopScanner()}>
            <CameraOff className="mr-2 size-4" />
            Stop camera
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Use the rear camera when prompted. Works on <code className="rounded bg-muted px-1">localhost</code> over
        HTTPS or secure context.
      </p>
    </div>
  );
}
