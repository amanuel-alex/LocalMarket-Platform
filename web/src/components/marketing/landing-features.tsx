"use client";

import { motion } from "framer-motion";
import { Bot, MapPin, QrCode, Scale } from "lucide-react";

import { fadeItem, staggerContainer } from "@/components/marketing/landing-motion";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";
import { cn } from "@/lib/utils";

const icons = [Scale, MapPin, QrCode, Bot] as const;

export function LandingFeatures() {
  const { messages } = useLandingI18n();
  const items = messages.features.items;

  return (
    <section id="features" className="scroll-mt-32 py-20 md:scroll-mt-36 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            {messages.features.eyebrow}
          </motion.p>
          <motion.h2
            variants={fadeItem}
            className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl"
          >
            {messages.features.title}
          </motion.h2>
          <motion.p
            variants={fadeItem}
            className="mt-4 text-pretty text-lg text-zinc-600 dark:text-zinc-400"
          >
            {messages.features.subtitle}
          </motion.p>
        </motion.div>

        <motion.ul
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          variants={staggerContainer}
        >
          {items.map((f, i) => {
            const Icon = icons[i] ?? Scale;
            return (
              <motion.li
                key={f.title}
                variants={fadeItem}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/80 p-6 shadow-sm",
                  "dark:border-zinc-800 dark:bg-zinc-900/60",
                  "transition-shadow duration-300 hover:border-violet-200/80 hover:shadow-lg hover:shadow-violet-500/10 dark:hover:border-violet-800/60",
                )}
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />
                <div className="relative flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
                  <Icon className="size-6" strokeWidth={1.75} />
                </div>
                <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {f.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {f.description}
                </p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
