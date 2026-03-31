/** Max JSON nesting to mitigate prototype / deep object abuse. */
const MAX_DEPTH = 20;
/** Soft cap per string field after trim (large fields use dedicated limits in Zod). */
const MAX_STRING_LEN = 50_000;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Trims strings, strips null bytes, caps length; sanitizes object keys (alphanumeric + ._-);
 * passes numbers/booleans through. Intended for `req.body` after JSON parse.
 */
export function sanitizeJsonInput(input: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return null;
  }
  if (input === null || input === undefined) {
    return input;
  }
  if (typeof input === "string") {
    return input.replace(/\0/g, "").trim().slice(0, MAX_STRING_LEN);
  }
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : null;
  }
  if (typeof input === "boolean") {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((x) => sanitizeJsonInput(x, depth + 1));
  }
  if (isPlainObject(input)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input)) {
      const safeKey = k.replace(/[^\w.-]/g, "").slice(0, 120);
      if (!safeKey) continue;
      out[safeKey] = sanitizeJsonInput(v, depth + 1);
    }
    return out;
  }
  return null;
}
