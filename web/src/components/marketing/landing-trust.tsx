"use client";

import { motion } from "framer-motion";
import { Check, Shield } from "lucide-react";

import { fadeItem, staggerContainer } from "@/components/marketing/landing-motion";

const bullets = [
  "Verified transactions with structured order and payment states",
  "Local-first design: proximity, language, and regional payment patterns",
  "Transparent pricing and comparison before you buy",
  "Secure payments with clear status from pending to completed",
];

export function LandingTrust() {
  return (
    <section
      id="trust"
      className="scroll-mt-24 border-t border-zinc-200/80 bg-gradient-to-br from-zinc-50 via-white to-indigo-50/30 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeItem}
              className="inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30"
            >
              <Shield className="size-7" strokeWidth={1.5} />
            </motion.div>
            <motion.h2
              variants={fadeItem}
              className="mt-6 text-balance text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl"
            >
              Why choose EthioLocal?
            </motion.h2>
            <motion.p variants={fadeItem} className="mt-4 text-pretty text-lg text-zinc-600">
              We combine marketplace mechanics with verification and analytics so communities can trade with
              confidence—not just convenience.
            </motion.p>
          </motion.div>

          <motion.ul
            className="space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            {bullets.map((text) => (
              <motion.li
                key={text}
                variants={fadeItem}
                className="flex gap-4 rounded-2xl border border-zinc-200/90 bg-white/90 p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Check className="size-4" strokeWidth={2.5} />
                </span>
                <p className="text-sm font-medium leading-relaxed text-zinc-800 md:text-base">{text}</p>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
