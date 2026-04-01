"use client";

import { motion } from "framer-motion";
import { ArrowRight, CreditCard, LayoutGrid, QrCode, TrendingUp } from "lucide-react";

import { fadeItem, staggerContainer } from "@/components/marketing/landing-motion";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";
import { cn } from "@/lib/utils";

const icons = [LayoutGrid, TrendingUp, CreditCard, QrCode] as const;

export function LandingHowItWorks() {
  const { messages } = useLandingI18n();
  const w = messages.howItWorks;
  const steps = w.steps.map((s, i) => ({
    step: String(i + 1).padStart(2, "0"),
    title: s.title,
    description: s.description,
    icon: icons[i] ?? LayoutGrid,
  }));

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-zinc-200/80 bg-gradient-to-b from-zinc-50/80 via-white to-violet-50/20 py-20 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-violet-950/20 md:py-28"
    >
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
            {w.eyebrow}
          </motion.p>
          <motion.h2
            variants={fadeItem}
            className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl"
          >
            {w.title}
          </motion.h2>
          <motion.p
            variants={fadeItem}
            className="mt-4 text-pretty text-lg text-zinc-600 dark:text-zinc-400"
          >
            {w.subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
        >
          <div className="hidden lg:flex lg:items-stretch lg:justify-between lg:gap-4">
            {steps.map((s, i) => (
              <div key={s.step} className="flex flex-1 items-stretch">
                <motion.div variants={fadeItem} className="flex flex-1 flex-col">
                  <div
                    className={cn(
                      "flex flex-1 flex-col rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm transition",
                      "hover:border-violet-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-violet-800/60",
                    )}
                  >
                    <span className="text-xs font-bold tabular-nums text-violet-500 dark:text-violet-400">
                      {s.step}
                    </span>
                    <div className="mt-4 flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                      <s.icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {s.description}
                    </p>
                  </div>
                </motion.div>
                {i < steps.length - 1 ? (
                  <div className="flex w-10 shrink-0 items-center justify-center self-center pt-8">
                    <ArrowRight className="size-5 text-zinc-300 dark:text-zinc-600" aria-hidden />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:hidden">
            {steps.map((s) => (
              <motion.div
                key={s.step}
                variants={fadeItem}
                className="relative rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <span className="text-xs font-bold tabular-nums text-violet-500 dark:text-violet-400">
                  {s.step}
                </span>
                <div className="mt-3 flex size-11 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <s.icon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
