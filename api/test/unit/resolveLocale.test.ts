import { describe, expect, it } from "vitest";
import {
  normalizeLocaleTag,
  pickFromAcceptLanguage,
  resolveRequestLocale,
} from "../../src/i18n/resolveLocale.js";
import type { Request } from "express";

function mockReq(partial: Partial<Request> & { query?: Record<string, unknown> }): Request {
  return partial as Request;
}

describe("resolveLocale", () => {
  it("normalizes Amharic and Oromo tags", () => {
    expect(normalizeLocaleTag("am")).toBe("am");
    expect(normalizeLocaleTag("AM-ET")).toBe("am");
    expect(normalizeLocaleTag("om")).toBe("om");
    expect(normalizeLocaleTag("or")).toBe("om");
    expect(normalizeLocaleTag("xx")).toBeNull();
  });

  it("picks from Accept-Language by weight", () => {
    expect(pickFromAcceptLanguage("om;q=0.9,en;q=0.8")).toBe("om");
    expect(pickFromAcceptLanguage("fr, en;q=0.8")).toBe("en");
  });

  it("resolves query param over headers", () => {
    const req = mockReq({
      query: { lang: "am" },
      headers: { "accept-language": "en-US,en;q=0.9" },
    });
    expect(resolveRequestLocale(req)).toBe("am");
  });

  it("falls back to en", () => {
    const req = mockReq({
      query: {},
      headers: { "accept-language": "fr-FR,de;q=0.8" },
    });
    expect(resolveRequestLocale(req)).toBe("en");
  });
});
