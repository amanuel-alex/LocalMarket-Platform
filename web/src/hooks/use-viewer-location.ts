"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ViewerLocationStatus = "idle" | "loading" | "ready" | "denied" | "unavailable" | "error";

export function useViewerLocation(options?: { auto?: boolean }) {
  const auto = options?.auto ?? false;
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [status, setStatus] = useState<ViewerLocationStatus>(() => (auto ? "loading" : "idle"));
  const ranAuto = useRef(false);

  const resolveLabel = useCallback(async (latitude: number, longitude: number) => {
    try {
      const r = await fetch(`/geo/reverse?lat=${encodeURIComponent(String(latitude))}&lng=${encodeURIComponent(String(longitude))}`);
      if (!r.ok) return;
      const j = (await r.json()) as { label?: string | null };
      if (typeof j.label === "string" && j.label.length > 0) setLabel(j.label);
    } catch {
      /* optional */
    }
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = pos.coords.latitude;
        const ln = pos.coords.longitude;
        setLat(la);
        setLng(ln);
        setStatus("ready");
        void resolveLabel(la, ln);
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, maximumAge: 120_000, timeout: 20_000 },
    );
  }, [resolveLabel]);

  useEffect(() => {
    if (!auto || ranAuto.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    ranAuto.current = true;
    request();
  }, [auto, request]);

  return { lat, lng, label, status, request };
}
