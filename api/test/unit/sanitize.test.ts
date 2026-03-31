import { describe, expect, it } from "vitest";
import { sanitizeJsonInput } from "../../src/utils/sanitize.js";

describe("sanitizeJsonInput", () => {
  it("trims strings and strips null bytes", () => {
    expect(sanitizeJsonInput("  hello\0world  ")).toBe("helloworld");
  });

  it("sanitizes object keys and nested values", () => {
    const out = sanitizeJsonInput({
      "unsafe$key": "  x  ",
      safe: "  y  ",
      nested: { ok: 1 },
    }) as Record<string, unknown>;
    expect(out).not.toHaveProperty("unsafe$key");
    expect(out.safe).toBe("y");
    expect(typeof out.nested).toBe("object");
  });

  it("rejects non-finite numbers", () => {
    expect(sanitizeJsonInput(Number.NaN)).toBeNull();
    expect(sanitizeJsonInput(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
