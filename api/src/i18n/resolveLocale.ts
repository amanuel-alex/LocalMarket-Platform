import type { Request } from "express";
import type { Locale } from "@prisma/client";

const SUPPORTED = new Set<Locale>(["en", "am", "om"]);

export function normalizeLocaleTag(raw: string): Locale | null {
  const base = raw.toLowerCase().trim().split("-")[0]?.slice(0, 2) ?? "";
  if (base === "en" || base === "am") return base;
  /** Oromo: `om`, sometimes `om-ET`. */
  if (base === "om" || base === "or") return "om";
  return null;
}

/** Parse `Accept-Language` loosely: highest-weight first wins among supported. */
export function pickFromAcceptLanguage(header: string | undefined): Locale | null {
  if (!header?.trim()) return null;
  const parts = header.split(",").map((p) => p.trim());
  const candidates: { code: string; q: number }[] = [];
  for (const part of parts) {
    const [langPart, ...params] = part.split(";").map((s) => s.trim());
    if (!langPart) continue;
    let q = 1;
    for (const p of params) {
      if (p.startsWith("q=")) {
        const v = Number.parseFloat(p.slice(2));
        if (!Number.isNaN(v)) q = v;
      }
    }
    candidates.push({ code: langPart, q });
  }
  candidates.sort((a, b) => b.q - a.q);
  for (const c of candidates) {
    const loc = normalizeLocaleTag(c.code);
    if (loc) return loc;
  }
  return null;
}

/**
 * Priority: `?lang=` → `X-Locale` header → `Accept-Language` → default `en`.
 */
export function resolveRequestLocale(req: Request): Locale {
  const q = req.query?.lang;
  if (typeof q === "string") {
    const loc = normalizeLocaleTag(q);
    if (loc) return loc;
  }
  const xl = req.headers["x-locale"];
  if (typeof xl === "string") {
    const loc = normalizeLocaleTag(xl);
    if (loc) return loc;
  }
  const al = req.headers["accept-language"];
  if (typeof al === "string") {
    const loc = pickFromAcceptLanguage(al);
    if (loc) return loc;
  }
  return "en";
}

export function isLocale(v: string): v is Locale {
  return SUPPORTED.has(v as Locale);
}
