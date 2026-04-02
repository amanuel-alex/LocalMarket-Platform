import { NextRequest, NextResponse } from "next/server";

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  state?: string;
  county?: string;
  country?: string;
};

type NominatimJson = {
  display_name?: string;
  address?: NominatimAddress;
};

function shortLabel(data: NominatimJson): string {
  const a = data.address;
  if (a) {
    const place = a.city ?? a.town ?? a.village ?? a.suburb ?? a.state ?? a.county;
    if (place && a.country) return `${place}, ${a.country}`;
    if (place) return place;
  }
  const full = data.display_name;
  if (full) {
    const parts = full.split(",").map((s) => s.trim());
    return parts.slice(0, 3).join(", ");
  }
  return "";
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");
  const latN = lat != null ? Number(lat) : NaN;
  const lngN = lng != null ? Number(lng) : NaN;
  if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
    return NextResponse.json({ error: "invalid_coordinates" }, { status: 400 });
  }
  if (Math.abs(latN) > 90 || Math.abs(lngN) > 180) {
    return NextResponse.json({ error: "out_of_range" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(latN));
  url.searchParams.set("lon", String(lngN));
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "EthioLocal-Marketplace/1.0 (https://github.com/localmarket)",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "geocode_upstream", status: res.status }, { status: 502 });
    }
    const data = (await res.json()) as NominatimJson;
    const label = shortLabel(data);
    return NextResponse.json({ label: label || null });
  } catch {
    return NextResponse.json({ error: "geocode_failed" }, { status: 502 });
  }
}
