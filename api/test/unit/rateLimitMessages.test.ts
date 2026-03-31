import { describe, expect, it } from "vitest";
import { translateRateLimitMessage } from "../../src/i18n/rateLimitMessages.js";

describe("translateRateLimitMessage", () => {
  it("returns locale-specific copy", () => {
    expect(translateRateLimitMessage("en", "login")).toMatch(/login/i);
    expect(translateRateLimitMessage("am", "login").length).toBeGreaterThan(10);
    expect(translateRateLimitMessage("om", "global")).toMatch(/Gaaffii/i);
  });

  it("falls back to English for unknown locale via caller", () => {
    expect(translateRateLimitMessage("en", "payment_callback")).toContain("payment");
  });
});
