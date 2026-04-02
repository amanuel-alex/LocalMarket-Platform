"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Truck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeItem, staggerContainer } from "@/components/marketing/landing-motion";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";

export function LandingHero() {
  const router = useRouter();
  const { messages } = useLandingI18n();
  const h = messages.hero;
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/shop");
  }

  return (
    <section className="relative overflow-hidden border-b border-zinc-200/80 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 pt-24 pb-14 text-white dark:border-zinc-800 md:pt-28 md:pb-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(251,191,36,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <motion.p
            variants={fadeItem}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90"
          >
            {h.badge}
          </motion.p>
          <motion.h1
            variants={fadeItem}
            className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl md:leading-tight"
          >
            {h.titleBefore}{" "}
            <span className="bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">
              {h.titleHighlight}
            </span>
          </motion.h1>
          <motion.p
            variants={fadeItem}
            className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base"
          >
            {h.subtitle}
          </motion.p>
        </motion.div>

        <motion.form
          variants={fadeItem}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
          onSubmit={onSearch}
          className="mx-auto mt-10 max-w-3xl"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:rounded-lg sm:bg-white sm:p-1.5 sm:shadow-lg sm:shadow-black/20 dark:sm:bg-zinc-100">
            <label className="relative flex flex-1 items-center">
              <span className="sr-only">{h.searchAria}</span>
              <Search className="pointer-events-none absolute left-4 size-5 text-zinc-500 sm:left-3" aria-hidden />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={h.searchPlaceholder}
                className="h-12 rounded-lg border-zinc-600/80 bg-zinc-800/80 pl-12 text-base text-white placeholder:text-zinc-500 sm:h-14 sm:border-0 sm:bg-transparent sm:pl-11 sm:text-zinc-900 sm:placeholder:text-zinc-400 dark:sm:text-zinc-900"
                autoComplete="off"
                aria-label={h.searchAria}
              />
            </label>
            <Button
              type="submit"
              className="h-12 shrink-0 rounded-lg bg-amber-500 px-8 text-base font-semibold text-zinc-950 hover:bg-amber-400 sm:h-14 sm:rounded-md"
            >
              {h.searchButton}
            </Button>
          </div>
          <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-zinc-400">
            <Truck className="size-3.5 shrink-0 text-amber-500/90" aria-hidden />
            <span>{h.searchHint}</span>
          </p>
        </motion.form>

        <motion.div
          variants={fadeItem}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.25 }}
          className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            size="lg"
            asChild
            className="rounded-lg bg-white px-6 text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-100"
          >
            <Link href="/shop">{h.ctaSecondary}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="rounded-lg border-zinc-600 bg-transparent text-white hover:bg-zinc-800 hover:text-white"
          >
            <Link href="/register">{h.ctaPrimary}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
