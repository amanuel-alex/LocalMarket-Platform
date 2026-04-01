"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Globe, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LandingThemeToggle } from "@/components/marketing/landing-theme-toggle";
import type { LandingLocale } from "@/lib/i18n/landing-i18n-context";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";
import { cn } from "@/lib/utils";

const LANGS: { code: LandingLocale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "am", label: "አማርኛ" },
  { code: "om", label: "Afaan Oromoo" },
];

export function LandingHeader() {
  const { locale, setLocale, messages } = useLandingI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { label: messages.nav.features, href: "#features" },
    { label: messages.nav.howItWorks, href: "#how-it-works" },
    { label: messages.nav.product, href: "#preview" },
    { label: messages.nav.trending, href: "#trending" },
    { label: messages.nav.trust, href: "#trust" },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter,border-color] duration-300",
        scrolled
          ? "border-b border-zinc-200/80 bg-white/90 shadow-sm shadow-zinc-900/5 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-black/20"
          : "border-b border-transparent bg-white/50 backdrop-blur-md dark:bg-zinc-950/50",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-500/25">
            E
          </span>
          <span className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            EthioLocal
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-50 xl:px-3"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 sm:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl border-zinc-200 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/80"
              >
                <Globe className="size-4" />
                <span className="hidden md:inline">{messages.header.language}</span>
                <span className="font-mono text-xs uppercase text-zinc-500">{locale}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuLabel className="text-xs text-zinc-500">{messages.header.language}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LANGS.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  className="gap-2 rounded-lg"
                  onClick={() => setLocale(l.code)}
                >
                  {locale === l.code ? <Check className="size-4 text-violet-600" /> : <span className="size-4" />}
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <LandingThemeToggle />

          <Button variant="ghost" asChild className="hidden rounded-xl text-zinc-700 dark:text-zinc-300 md:inline-flex">
            <Link href="/shop">{messages.header.shop}</Link>
          </Button>
          <Button variant="ghost" asChild className="hidden rounded-xl text-zinc-700 dark:text-zinc-300 md:inline-flex">
            <Link href="/login">{messages.header.signIn}</Link>
          </Button>
          <Button
            asChild
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 text-white shadow-md shadow-violet-500/25 transition hover:opacity-95 hover:shadow-lg hover:shadow-violet-500/30"
          >
            <Link href="/register">{messages.header.getStarted}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <LandingThemeToggle />
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/80"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-zinc-200/80 bg-white/98 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/98 sm:hidden"
        >
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-200"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <hr className="my-2 border-zinc-200 dark:border-zinc-800" />
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{messages.header.language}</p>
            <div className="flex flex-wrap gap-2 px-2 pb-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    locale === l.code
                      ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
                  )}
                  onClick={() => {
                    setLocale(l.code);
                    setOpen(false);
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <Link
              href="/shop"
              className="rounded-xl px-3 py-3 text-sm font-medium text-zinc-800 dark:text-zinc-200"
              onClick={() => setOpen(false)}
            >
              {messages.header.shop}
            </Link>
            <Link
              href="/login"
              className="rounded-xl px-3 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400"
              onClick={() => setOpen(false)}
            >
              {messages.header.signIn}
            </Link>
            <Link
              href="/register"
              className="mt-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              {messages.header.getStarted}
            </Link>
          </div>
        </motion.div>
      ) : null}
    </header>
  );
}
