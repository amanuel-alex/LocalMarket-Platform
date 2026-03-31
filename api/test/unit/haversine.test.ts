import { describe, expect, it } from "vitest";
import { haversineDistanceKm } from "../../src/utils/haversine.js";

describe("haversineDistanceKm", () => {
  it("returns ~0 for identical points", () => {
    expect(haversineDistanceKm(-1.2921, 36.8219, -1.2921, 36.8219)).toBeLessThan(0.001);
  });

  it("returns plausible distance for two Nairobi-area points", () => {
    const km = haversineDistanceKm(-1.2921, 36.8219, -1.3032, 36.81);
    expect(km).toBeGreaterThan(0.5);
    expect(km).toBeLessThan(50);
  });
});
