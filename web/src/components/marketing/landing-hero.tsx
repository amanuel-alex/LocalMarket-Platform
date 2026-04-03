"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeItem, staggerContainer } from "@/components/marketing/landing-motion";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";

const QUICK = [
  { label: "Grains", href: "/shop?category=Grains" },
  { label: "Beverages", href: "/shop?category=Beverages" },
  { label: "Produce", href: "/shop?category=Produce" },
  { label: "Pantry", href: "/shop?category=Pantry" },
];

export function LandingHero() {
  const { messages } = useLandingI18n();
  const h = messages.hero;
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) {
      router.push("/shop");
      return;
    }
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section id="home" className="relative scroll-mt-32 overflow-hidden pt-28 pb-14 md:scroll-mt-36 md:pt-32 md:pb-20 lg:pt-36">
      <div
        className="pointer-events-none absolute -left-1/4 top-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-amber-400/20 via-orange-300/15 to-transparent blur-3xl dark:from-amber-600/15 dark:via-orange-600/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-1/4 top-1/4 h-[380px] w-[380px] rounded-full bg-gradient-to-bl from-violet-400/15 via-indigo-300/10 to-transparent blur-3xl dark:from-violet-600/12 dark:via-indigo-600/8"
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
          <motion.div variants={fadeItem} className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800 shadow-sm backdrop-blur-sm dark:border-amber-800/50 dark:bg-zinc-900/90 dark:text-amber-200">
              <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400" />
              {h.badge}
            </span>
          </motion.div>

          <motion.h1
            variants={fadeItem}
            className="mt-6 text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl md:text-5xl md:leading-[1.1]"
          >
            {h.titleBefore}{" "}
            <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 bg-clip-text text-transparent dark:from-amber-400 dark:via-orange-400 dark:to-amber-400">
              {h.titleHighlight}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeItem}
            className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg"
          >
            {h.subtitle}
          </motion.p>

          <motion.form
            variants={fadeItem}
            onSubmit={onSearch}
            className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-stretch"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-zinc-400" aria-hidden />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={h.searchPlaceholder}
                aria-label={h.searchAria}
                className="h-12 rounded-xl border-zinc-200 bg-white pl-11 pr-3 text-base shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <Button
              type="submit"
              className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 font-semibold text-white shadow-md hover:opacity-95 sm:w-auto"
            >
              {h.searchButton}
            </Button>
          </motion.form>

          <motion.div variants={fadeItem} className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {QUICK.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-zinc-200/90 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-amber-300 hover:text-amber-900 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-amber-700"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>

          <motion.div
            variants={fadeItem}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Button
              size="lg"
              asChild
              className="h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-7 text-base font-semibold text-white shadow-lg shadow-amber-600/25 transition hover:opacity-95"
            >
              <Link href="/register/buyer">
                {h.ctaPrimary}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-11 rounded-xl border-zinc-200/90 bg-white/70 px-7 text-base font-semibold text-zinc-800 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100"
            >
              <Link href="/shop">{h.ctaSecondary}</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
