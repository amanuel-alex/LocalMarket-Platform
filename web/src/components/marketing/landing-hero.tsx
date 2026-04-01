"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fadeItem, staggerContainer } from "@/components/marketing/landing-motion";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";

export function LandingHero() {
  const { messages } = useLandingI18n();
  const h = messages.hero;

  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-40 lg:pb-32">
      <div
        className="pointer-events-none absolute -left-1/4 top-0 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-violet-400/25 via-indigo-400/20 to-transparent blur-3xl dark:from-violet-600/20 dark:via-indigo-600/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-1/4 top-1/4 h-[480px] w-[480px] rounded-full bg-gradient-to-bl from-indigo-400/20 via-violet-300/15 to-transparent blur-3xl dark:from-indigo-500/15 dark:via-violet-500/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[90%] max-w-3xl -translate-x-1/2 rounded-full bg-gradient-to-t from-violet-500/10 to-transparent blur-2xl dark:from-violet-600/15"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeItem} className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 shadow-sm backdrop-blur-sm dark:border-violet-800/60 dark:bg-zinc-900/80 dark:text-violet-300">
              <Sparkles className="size-3.5 text-violet-500 dark:text-violet-400" />
              {h.badge}
            </span>
          </motion.div>

          <motion.h1
            variants={fadeItem}
            className="mt-8 text-balance text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl md:text-6xl md:leading-[1.08]"
          >
            {h.titleBefore}{" "}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-violet-400 dark:via-indigo-400 dark:to-violet-400">
              {h.titleHighlight}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeItem}
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl md:leading-relaxed"
          >
            {h.subtitle}
          </motion.p>

          <motion.div
            variants={fadeItem}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Button
              size="lg"
              asChild
              className="h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02] hover:opacity-95 hover:shadow-xl hover:shadow-violet-500/35 active:scale-[0.98]"
            >
              <Link href="/register">
                {h.ctaPrimary}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 rounded-2xl border-zinc-200/90 bg-white/60 px-8 text-base font-semibold text-zinc-800 shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              <Link href="/shop">{h.ctaSecondary}</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-5xl md:mt-24"
        >
          {/* Premium browser mock — Stripe / Linear style */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-2 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.12)] ring-1 ring-zinc-900/[0.04] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)] dark:ring-white/[0.06] md:rounded-3xl md:p-2.5">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_35%,rgba(139,92,246,0.04)_50%,transparent_65%)]" aria-hidden />
            <div className="relative flex min-h-[220px] flex-col overflow-hidden rounded-2xl bg-zinc-50/90 dark:bg-zinc-900/95 md:min-h-[300px] md:rounded-[1.35rem]">
              {/* Title bar */}
              <div className="flex items-center gap-3 border-b border-zinc-200/80 bg-white/95 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-950/90">
                <div className="flex gap-2">
                  <span className="size-3 rounded-full bg-[#FF5F57] shadow-sm ring-1 ring-black/[0.06]" />
                  <span className="size-3 rounded-full bg-[#FEBC2E] shadow-sm ring-1 ring-black/[0.06]" />
                  <span className="size-3 rounded-full bg-[#28C840] shadow-sm ring-1 ring-black/[0.06]" />
                </div>
                <div className="mx-auto hidden h-2 max-w-md flex-1 rounded-full bg-zinc-100 sm:block dark:bg-zinc-800" />
              </div>

              {/* Three-column dashboard */}
              <div className="grid flex-1 gap-3 p-4 md:grid-cols-3 md:gap-4 md:p-5">
                {/* Left: featured block + skeleton */}
                <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="h-24 rounded-2xl bg-gradient-to-br from-violet-200/90 via-violet-100 to-indigo-100/80 shadow-inner dark:from-violet-900/50 dark:via-violet-950/60 dark:to-indigo-950/50 md:h-28" />
                  <div className="space-y-2.5 pt-1">
                    <div className="h-2 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-2 w-[92%] rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-2 w-[70%] rounded-full bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                </div>

                {/* Middle: gradient bar chart (price comparison metaphor) */}
                <div className="hidden flex-col rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:flex">
                  <div className="flex h-36 flex-1 items-end justify-between gap-1.5 px-0.5 pt-2">
                    {[38, 62, 44, 88, 52, 95, 68, 78].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.45 + i * 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full max-w-[11%] rounded-t-lg bg-gradient-to-t from-violet-700 via-violet-500 to-indigo-400 shadow-sm dark:from-violet-600 dark:via-violet-500 dark:to-indigo-400"
                        style={{ maxHeight: "100%" }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 w-28 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-1.5 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                </div>

                {/* Right: status + QR verified */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 md:min-h-0">
                  <div className="flex items-start gap-3">
                    <div className="size-11 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-500/20" />
                    <div className="min-w-0 flex-1 space-y-2 pt-1">
                      <div className="h-2.5 w-full max-w-[140px] rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <div className="h-2 w-3/4 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-dashed border-violet-300/90 bg-violet-50/80 px-3 py-3 text-center text-[11px] font-semibold leading-snug tracking-wide text-violet-800 shadow-sm dark:border-violet-600/50 dark:bg-violet-950/50 dark:text-violet-200 md:text-xs">
                    {h.mockQr}
                  </div>
                </div>
              </div>

              {/* Mobile: compact chart row */}
              <div className="flex border-t border-zinc-200/80 px-4 pb-4 pt-3 md:hidden dark:border-zinc-800">
                <div className="flex h-24 w-full items-end justify-between gap-1">
                  {[38, 62, 44, 88, 52, 95, 68, 78].map((height, i) => (
                    <div
                      key={i}
                      className="w-full max-w-[11%] rounded-t-md bg-gradient-to-t from-violet-700 via-violet-500 to-indigo-400"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
