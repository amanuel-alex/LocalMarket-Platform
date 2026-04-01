/** Map browse to coordinates for smart ranking (approximate city centers). */
export const SHOP_CITY_PRESETS = [
  { id: "all", name: "All areas", lat: undefined as number | undefined, lng: undefined as number | undefined },
  { id: "addis", name: "Addis Ababa", lat: 9.03, lng: 38.75 },
  { id: "hawassa", name: "Hawassa", lat: 7.05, lng: 38.47 },
  { id: "bahir", name: "Bahir Dar", lat: 11.6, lng: 37.38 },
  { id: "dire", name: "Dire Dawa", lat: 9.59, lng: 41.86 },
] as const;

/** Shown on product detail before checkout; official fee is on the receipt after payment. */
export const PLATFORM_FEE_ESTIMATE_PERCENT = 5;
