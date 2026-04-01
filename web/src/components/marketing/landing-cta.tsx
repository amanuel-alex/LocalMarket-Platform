"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fadeItem, staggerContainer } from "@/components/marketing/landing-motion";

export function LandingCta() {
  return (
    <section id="cta" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="relative overflow-hidden rounded-3xl border border-violet-200/60 bg-gradient-to-br from-violet-600 via-indigo-600 to-violet-700 px-8 py-16 text-center shadow-2xl shadow-violet-600/25 md:px-16 md:py-20"
        >
          <div
            className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl"
            aria-hidden
          />
          <motion.h2
            variants={fadeItem}
            className="relative text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl"
          >
            Start buying smarter today
          </motion.h2>
          <motion.p
            variants={fadeItem}
            className="relative mx-auto mt-4 max-w-xl text-pretty text-lg text-violet-100 md:text-xl"
          >
            Join thousands of locals who compare, pay, and verify in one trusted place.
          </motion.p>
          <motion.div variants={fadeItem} className="relative mt-10">
            <Button
              size="lg"
              asChild
              className="h-14 rounded-2xl border-0 bg-white px-10 text-base font-semibold text-violet-700 shadow-lg transition hover:scale-[1.02] hover:bg-zinc-50 active:scale-[0.98]"
            >
              <Link href="/register">
                Join EthioLocal
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
