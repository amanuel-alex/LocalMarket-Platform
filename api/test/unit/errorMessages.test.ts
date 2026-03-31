import { describe, expect, it } from "vitest";
import { translateErrorCode } from "../../src/i18n/errorMessages.js";

describe("translateErrorCode", () => {
  it("keeps specific English fallback for en", () => {
    expect(translateErrorCode("en", "NOT_FOUND", "Product not found")).toBe("Product not found");
  });

  it("uses Amharic when available for am", () => {
    const msg = translateErrorCode("am", "NOT_FOUND", "Product not found");
    expect(msg).not.toBe("Product not found");
    expect(msg.length).toBeGreaterThan(3);
  });

  it("uses English fallback for om when key missing", () => {
    expect(translateErrorCode("om", "SOME_UNKNOWN_CODE", "Detail")).toBe("Detail");
  });
});
