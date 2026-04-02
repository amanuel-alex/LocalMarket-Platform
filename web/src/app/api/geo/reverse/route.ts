import { NextResponse } from "next/server";

type NominatimReverse = {
  display_name?: string;
  address?: Record<string, string>;
};

/**
 * Server-side reverse geocoding (avoids browser CORS).
 * Uses OpenStreetMap Nominatim; identify your app per their usage policy.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "EthioLocal/1.0",
      },
      next: { revalidate: 86_400 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
    }
    const data = (await res.json()) as NominatimReverse;
    const displayName = data.display_name ?? null;
    const address = data.address ?? {};
    const shortLabel =
      [address.city, address.town, address.village, address.municipality, address.county].find(Boolean) ??
      address.state ??
      address.region ??
      displayName?.split(",").slice(0, 2).join(",").trim() ??
      null;

    return NextResponse.json({
      displayName,
      shortLabel,
      address,
    });
  } catch {
    return NextResponse.json({ error: "Geocoding unavailable" }, { status: 503 });
  }
}
