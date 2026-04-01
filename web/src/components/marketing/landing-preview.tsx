"use client";

import { motion } from "framer-motion";
import { BarChart3, Bell, LayoutDashboard, Smartphone } from "lucide-react";

import { fadeItem, staggerContainer } from "@/components/marketing/landing-motion";
import type { LandingMessages } from "@/lib/i18n/landing-i18n-context";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";

function DashboardMock({ p }: { p: LandingMessages["preview"] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-zinc-950 text-zinc-100 shadow-2xl shadow-zinc-900/40 ring-1 ring-white/10">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <LayoutDashboard className="size-4 text-violet-400" />
        <span className="text-xs font-medium text-zinc-400">{p.adminLabel}</span>
        <div className="ml-auto flex items-center gap-2">
          <Bell className="size-4 text-zinc-500" />
          <div className="size-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600" />
        </div>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{p.revenue}</p>
            <p className="mt-1 text-xl font-semibold text-white">ETB 128,400</p>
            <p className="text-[10px] text-emerald-400">+12%</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <p className="text-[10px] text-zinc-500">{p.orders}</p>
              <p className="text-lg font-semibold">842</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <p className="text-[10px] text-zinc-500">{p.products}</p>
              <p className="text-lg font-semibold">1.2k</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] text-zinc-500">
            <BarChart3 className="size-3.5" />
            {p.salesTrend}
          </div>
          <div className="flex h-24 items-end justify-between gap-1 px-1">
            {[35, 55, 40, 70, 50, 85, 65, 90, 75, 95, 80, 88].map((h, i) => (
              <div
                key={i}
                className="w-full max-w-[6%] rounded-t-sm bg-gradient-to-t from-violet-600 to-indigo-500/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileMock({ p }: { p: LandingMessages["preview"] }) {
  return (
    <div className="relative mx-auto w-[220px] shrink-0 sm:w-[260px]">
      <div className="absolute left-1/2 top-0 z-10 h-6 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
      <div className="overflow-hidden rounded-[2rem] border-4 border-zinc-800 bg-zinc-900 p-2 shadow-2xl shadow-zinc-900/50 ring-1 ring-zinc-700">
        <div className="overflow-hidden rounded-[1.35rem] bg-white dark:bg-zinc-950">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-6 text-white">
            <p className="text-xs font-medium opacity-90">{p.goodMorning}</p>
            <p className="text-lg font-semibold">{p.nearbyDeals}</p>
          </div>
          <div className="space-y-3 p-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-2 dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <div className="size-14 shrink-0 rounded-lg bg-gradient-to-br from-violet-200 to-indigo-100 dark:from-violet-900/50 dark:to-indigo-900/40" />
                <div className="flex flex-1 flex-col justify-center gap-1.5">
                  <div className="h-2 w-3/4 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-2 w-1/2 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                  <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">{p.compareSellers}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mx-3 mb-3 flex justify-around rounded-2xl border border-zinc-100 bg-zinc-50 py-2 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-[10px]">{p.tabHome}</span>
            <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">{p.tabExplore}</span>
            <span className="text-[10px]">{p.tabOrders}</span>
            <span className="text-[10px]">{p.tabProfile}</span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-2 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-zinc-800" />
    </div>
  );
}

export function LandingPreview() {
  const { messages } = useLandingI18n();
  const p = messages.preview;

  return (
    <section id="preview" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p
            variants={fadeItem}
            className="text-sm font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400"
          >
            {p.eyebrow}
          </motion.p>
          <motion.h2
            variants={fadeItem}
            className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl"
          >
            {p.title}
          </motion.h2>
          <motion.p variants={fadeItem} className="mt-4 text-pretty text-lg text-zinc-600 dark:text-zinc-400">
            {p.subtitle}
          </motion.p>
        </motion.div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div
              className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-violet-500/15 via-transparent to-indigo-500/10 blur-2xl dark:from-violet-600/20 dark:to-indigo-600/15"
              aria-hidden
            />
            <div className="relative">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <LayoutDashboard className="size-4 text-violet-600 dark:text-violet-400" />
                {p.dashboardLabel}
              </div>
              <DashboardMock p={p} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Smartphone className="size-4 text-violet-600 dark:text-violet-400" />
              {p.mobileLabel}
            </div>
            <MobileMock p={p} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
