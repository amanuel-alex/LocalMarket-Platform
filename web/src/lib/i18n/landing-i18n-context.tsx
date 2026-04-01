"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import am from "@/lib/i18n/locales/am.json";
import en from "@/lib/i18n/locales/en.json";
import om from "@/lib/i18n/locales/om.json";

export type LandingLocale = "en" | "am" | "om";

export type LandingMessages = typeof en;

const STORAGE_KEY = "ethiolocal-landing-locale";

const bundles: Record<LandingLocale, LandingMessages> = {
  en: en as LandingMessages,
  am: am as LandingMessages,
  om: om as LandingMessages,
};

type Ctx = {
  locale: LandingLocale;
  setLocale: (l: LandingLocale) => void;
  messages: LandingMessages;
  t: (path: string) => string;
};

const LandingI18nContext = createContext<Ctx | null>(null);

function readString(obj: unknown, parts: string[]): string | undefined {
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function LandingI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LandingLocale>("en");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) as LandingLocale | null;
      if (raw === "en" || raw === "am" || raw === "om") {
        setLocaleState(raw);
        document.documentElement.lang = raw === "en" ? "en" : raw === "am" ? "am" : "om";
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLocale = useCallback((l: LandingLocale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = l === "en" ? "en" : l === "am" ? "am" : "om";
    }
  }, []);

  const messages = bundles[locale];

  const t = useCallback(
    (path: string) => {
      const v = readString(messages, path.split("."));
      return v ?? path;
    },
    [messages],
  );

  const value = useMemo(() => ({ locale, setLocale, messages, t }), [locale, setLocale, messages, t]);

  return <LandingI18nContext.Provider value={value}>{children}</LandingI18nContext.Provider>;
}

export function useLandingI18n() {
  const ctx = useContext(LandingI18nContext);
  if (!ctx) throw new Error("useLandingI18n must be used within LandingI18nProvider");
  return ctx;
}
