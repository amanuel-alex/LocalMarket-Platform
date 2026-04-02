"use client";

import { useCallback, useEffect, useState } from "react";

export type ViewerLocationStatus = "idle" | "prompt" | "loading" | "ready" | "denied" | "unavailable" | "error";

export type ViewerLocationState = {
  status: ViewerLocationStatus;
  lat: number | null;
  lng: number | null;
  /** Human-readable place from reverse geocode */
  placeLabel: string | null;
  errorMessage: string | null;
  refresh: () => void;
};

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const res = await fetch(`/api/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { shortLabel?: string | null; displayName?: string | null };
  return data.shortLabel ?? data.displayName ?? null;
}

export function useViewerLocation(): ViewerLocationState {
  const [status, setStatus] = useState<ViewerLocationStatus>("idle");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        const la = pos.coords.latitude;
        const ln = pos.coords.longitude;
        setLat(la);
        setLng(ln);
        setStatus("ready");
        try {
          const label = await reverseGeocode(la, ln);
          if (!cancelled) setPlaceLabel(label);
        } catch {
          if (!cancelled) setPlaceLabel(null);
        }
      },
      (err) => {
        if (cancelled) return;
        setLat(null);
        setLng(null);
        setPlaceLabel(null);
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setErrorMessage(null);
        } else {
          setStatus("error");
          setErrorMessage(err.message || "Location error");
        }
      },
      { enableHighAccuracy: false, maximumAge: 120_000, timeout: 15_000 },
    );

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { status, lat, lng, placeLabel, errorMessage, refresh };
}
