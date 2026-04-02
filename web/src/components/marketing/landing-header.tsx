"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Bell, Check, Globe, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { LandingThemeToggle } from "@/components/marketing/landing-theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LandingLocale } from "@/lib/i18n/landing-i18n-context";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";
import { cn } from "@/lib/utils";

const LANGS: { code: LandingLocale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "am", label: "አማርኛ" },
  { code: "om", label: "Afaan Oromoo" },
];

const subNavLeftClass =
  "whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:text-sm sm:px-2.5";

const subNavRightClass =
  "whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 sm:text-sm sm:px-2.5";

const ctaClass =
  "whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950/60 sm:text-sm sm:px-2.5";

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

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter,border-color] duration-300",
        scrolled
          ? "border-b border-zinc-200/80 bg-white/95 shadow-sm shadow-zinc-900/5 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-black/20"
          : "border-b border-zinc-200/60 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90",
      )}
    >
      {/* Row 1: logo · spacer · language, theme, notifications (+ auth compact) */}
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white shadow-md shadow-amber-600/25">
            E
          </span>
          <span className="truncate text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            EthioLocal
          </span>
        </Link>

        <div className="min-w-0 flex-1" aria-hidden />

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg border-zinc-200 bg-white/90 dark:border-zinc-700 dark:bg-zinc-900/90"
                >
                  <Globe className="size-4" />
                  <span className="hidden md:inline">{messages.header.language}</span>
                  <span className="font-mono text-[10px] uppercase text-zinc-500 sm:text-xs">{locale}</span>
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
                    {locale === l.code ? <Check className="size-4 text-amber-600" /> : <span className="size-4" />}
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 rounded-lg border-zinc-200 bg-white/90 dark:border-zinc-700 dark:bg-zinc-900/90"
                aria-label={messages.header.notifications}
              >
                <Bell className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl">
              <DropdownMenuLabel>{messages.header.notifications}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-3 text-sm text-zinc-500">{messages.header.notificationsEmpty}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-lg">
                <Link href="/shop/my-orders">{messages.header.orderUpdates}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <LandingThemeToggle />

          <div className="hidden items-center gap-1 lg:flex">
            <Button variant="ghost" size="sm" asChild className="rounded-lg text-zinc-700 dark:text-zinc-300">
              <Link href="/login">{messages.header.signIn}</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3 text-white shadow-sm hover:opacity-95"
            >
              <Link href="/register">{messages.header.getStarted}</Link>
            </Button>
          </div>

          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white/90 dark:border-zinc-700 dark:bg-zinc-900/90 sm:hidden"
            aria-label={open ? messages.header.closeMenu : messages.header.openMenu}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Row 2: marketplace nav (left) · trust & partner nav (right) */}
      <div
        className={cn(
          "hidden border-t border-zinc-200/80 dark:border-zinc-800 sm:block",
          scrolled ? "bg-white/95 dark:bg-zinc-950/95" : "bg-white/90 dark:bg-zinc-950/90",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
          <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scrollbar-none" aria-label="Marketplace">
            <Link href="#home" className={subNavLeftClass}>
              {messages.nav.home}
            </Link>
            <Link href="/shop" className={subNavLeftClass}>
              {messages.header.shop}
            </Link>
            <a href="#categories" className={subNavLeftClass}>
              {messages.nav.categories}
            </a>
            <a href="#trending" className={subNavLeftClass}>
              {messages.nav.trending}
            </a>
            <a href="#shop-local" className={subNavLeftClass} title={messages.nav.shopLocalHint}>
              {messages.nav.shopLocal}
            </a>
          </nav>
          <nav
            className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-l border-zinc-200/80 pl-3 dark:border-zinc-800"
            aria-label="Site"
          >
            <a href="#features" className={subNavRightClass}>
              {messages.nav.features}
            </a>
            <a href="#how-it-works" className={subNavRightClass}>
              {messages.nav.howItWorks}
            </a>
            <a href="#trust" className={subNavRightClass}>
              {messages.nav.trust}
            </a>
            <span className="mx-1 hidden h-4 w-px bg-zinc-200 dark:bg-zinc-700 sm:inline-block" aria-hidden />
            <Link href="/register" className={ctaClass}>
              {messages.nav.becomeSeller}
            </Link>
            <Link href="/register" className={ctaClass}>
              {messages.nav.becomeDelivery}
            </Link>
          </nav>
        </div>
      </div>

      {open ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-zinc-200/80 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 sm:hidden"
        >
          <div className="flex flex-col gap-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{messages.header.shop}</p>
            <Link href="#home" className="rounded-lg px-3 py-2.5 text-sm font-semibold" onClick={() => setOpen(false)}>
              {messages.nav.home}
            </Link>
            <Link href="/shop" className="rounded-lg px-3 py-2.5 text-sm font-semibold" onClick={() => setOpen(false)}>
              {messages.header.shop}
            </Link>
            <a href="#categories" className="rounded-lg px-3 py-2.5 text-sm font-semibold" onClick={() => setOpen(false)}>
              {messages.nav.categories}
            </a>
            <a href="#trending" className="rounded-lg px-3 py-2.5 text-sm font-semibold" onClick={() => setOpen(false)}>
              {messages.nav.trending}
            </a>
            <a href="#shop-local" className="rounded-lg px-3 py-2.5 text-sm font-semibold" onClick={() => setOpen(false)}>
              {messages.nav.shopLocal}
            </a>
            <hr className="my-2 border-zinc-200 dark:border-zinc-800" />
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">EthioLocal</p>
            <a href="#features" className="rounded-lg px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              {messages.nav.features}
            </a>
            <a href="#how-it-works" className="rounded-lg px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              {messages.nav.howItWorks}
            </a>
            <a href="#trust" className="rounded-lg px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              {messages.nav.trust}
            </a>
            <Link href="/register" className="rounded-lg px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-400" onClick={() => setOpen(false)}>
              {messages.nav.becomeSeller}
            </Link>
            <Link href="/register" className="rounded-lg px-3 py-2 text-sm font-semibold text-amber-700 dark:text-amber-400" onClick={() => setOpen(false)}>
              {messages.nav.becomeDelivery}
            </Link>
            <hr className="my-2 border-zinc-200 dark:border-zinc-800" />
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{messages.header.language}</p>
            <div className="flex flex-wrap gap-2 px-1 pb-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    locale === l.code
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
                  )}
                  onClick={() => {
                    setLocale(l.code);
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              {messages.header.signIn}
            </Link>
            <Link
              href="/register"
              className="mt-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-center text-sm font-semibold text-white"
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
