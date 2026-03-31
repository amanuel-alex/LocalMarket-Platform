import type { RequestHandler } from "express";
import { sanitizeJsonInput } from "../utils/sanitize.js";

/** Deep-sanitize parsed JSON bodies (trim, strip null bytes, tame keys). */
export const sanitizeBodyMiddleware: RequestHandler = (req, _res, next) => {
  if (req.body !== undefined && req.body !== null && typeof req.body === "object") {
    req.body = sanitizeJsonInput(req.body) as typeof req.body;
  }
  next();
};

function sanitizeQueryValue(v: unknown): unknown {
  if (typeof v === "string") {
    return sanitizeJsonInput(v);
  }
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === "string" ? sanitizeJsonInput(x) : x));
  }
  return v;
}

/** Sanitize string query params; drops suspicious key characters. */
export const sanitizeQueryMiddleware: RequestHandler = (req, _res, next) => {
  const q = req.query;
  if (!q || typeof q !== "object") {
    next();
    return;
  }
  const record = q as Record<string, unknown>;
  for (const k of Object.keys(record)) {
    const safeKey = k.replace(/[^\w.-]/g, "").slice(0, 120);
    if (safeKey !== k) {
      delete record[k];
      continue;
    }
    record[k] = sanitizeQueryValue(record[k]);
  }
  next();
};
