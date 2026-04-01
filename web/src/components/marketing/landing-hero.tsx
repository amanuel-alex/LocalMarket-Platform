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
              <a href="#features">{h.ctaSecondary}</a>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-5xl md:mt-24"
        >
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/80 to-violet-50/40 p-1 shadow-2xl shadow-zinc-900/10 ring-1 ring-zinc-900/5 dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-950 dark:to-violet-950/30 dark:shadow-black/40 dark:ring-white/5 md:rounded-3xl">
            <div className="absolute inset-0 rounded-[0.875rem] bg-[linear-gradient(105deg,transparent_40%,rgba(139,92,246,0.06)_50%,transparent_60%)] dark:rounded-[1.35rem] md:rounded-[1.35rem]" />
            <div className="relative flex h-full min-h-[200px] flex-col rounded-xl bg-white/90 p-4 shadow-inner dark:bg-zinc-950/90 md:min-h-[280px] md:rounded-[1.25rem] md:p-6">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex gap-1.5">
                  <span className="size-3 rounded-full bg-red-400/80" />
                  <span className="size-3 rounded-full bg-amber-400/80" />
                  <span className="size-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="mx-auto h-2 max-w-xs flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
              <div className="mt-4 grid flex-1 gap-4 md:grid-cols-3 md:gap-5">
                <div className="space-y-3 rounded-2xl border border-zinc-100 bg-gradient-to-b from-violet-50/50 to-white p-4 shadow-sm dark:border-zinc-800 dark:from-violet-950/40 dark:to-zinc-900">
                  <div className="h-2 w-16 rounded-full bg-violet-200 dark:bg-violet-800" />
                  <div className="h-16 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 dark:from-violet-600/30 dark:to-indigo-600/20" />
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-2 w-4/5 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                </div>
                <div className="hidden space-y-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:block">
                  <div className="flex h-28 items-end justify-between gap-1 px-1 pt-4">
                    {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                      <div
                        key={i}
                        className="w-full max-w-[14%] rounded-t-md bg-gradient-to-t from-violet-600/80 to-indigo-400/60"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  <div className="h-2 w-24 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                </div>
                <div className="hidden flex-col justify-between rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 md:flex">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/20" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-3/4 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                      <div className="h-2 w-1/2 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/30 p-3 text-center text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300">
                    {h.mockQr}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
