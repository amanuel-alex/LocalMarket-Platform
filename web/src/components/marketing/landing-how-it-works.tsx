"use client";

import { motion } from "framer-motion";
import { ArrowRight, CreditCard, LayoutGrid, QrCode, TrendingUp } from "lucide-react";

import { fadeItem, staggerContainer } from "@/components/marketing/landing-motion";

const steps = [
  {
    step: "01",
    title: "Browse products",
    description: "Search categories and nearby listings tailored to your location.",
    icon: LayoutGrid,
  },
  {
    step: "02",
    title: "Compare prices",
    description: "Stack offers from multiple sellers before you commit.",
    icon: TrendingUp,
  },
  {
    step: "03",
    title: "Pay securely",
    description: "Complete checkout with transparent totals and payment tracking.",
    icon: CreditCard,
  },
  {
    step: "04",
    title: "Verify with QR",
    description: "Scan at pickup so both sides know the handoff is legitimate.",
    icon: QrCode,
  },
];

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-zinc-200/80 bg-gradient-to-b from-zinc-50/80 via-white to-violet-50/20 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p variants={fadeItem} className="text-sm font-semibold uppercase tracking-widest text-violet-600">
            How it works
          </motion.p>
          <motion.h2
            variants={fadeItem}
            className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl"
          >
            From discovery to verified pickup
          </motion.h2>
          <motion.p variants={fadeItem} className="mt-4 text-pretty text-lg text-zinc-600">
            A linear flow that keeps buyers informed and sellers protected.
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
                  <div className="flex flex-1 flex-col rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm transition hover:border-violet-200 hover:shadow-md">
                    <span className="text-xs font-bold tabular-nums text-violet-500">{s.step}</span>
                    <div className="mt-4 flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                      <s.icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-zinc-900">{s.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{s.description}</p>
                  </div>
                </motion.div>
                {i < steps.length - 1 ? (
                  <div className="flex w-10 shrink-0 items-center justify-center self-center pt-8">
                    <ArrowRight className="size-5 text-zinc-300" aria-hidden />
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
                className="relative rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm"
              >
                <span className="text-xs font-bold tabular-nums text-violet-500">{s.step}</span>
                <div className="mt-3 flex size-11 items-center justify-center rounded-xl bg-zinc-100">
                  <s.icon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
