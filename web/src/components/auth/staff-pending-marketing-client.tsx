"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works";
import { LandingThemeToggle } from "@/components/marketing/landing-theme-toggle";
import { LandingTrust } from "@/components/marketing/landing-trust";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMe, toastApiError } from "@/lib/api";
import { mapAuthUserToStored } from "@/lib/auth-api";
import { clearSession, getStoredUser, mergeStoredUser } from "@/lib/auth-storage";
import { LandingI18nProvider } from "@/lib/i18n/landing-i18n-context";
import { getPostAuthRedirect, normalizeRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

const navLinkClass =
  "text-xs font-semibold text-zinc-600 transition hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-400 sm:text-sm";

export function StaffPendingMarketingClient({ variant }: { variant: "seller" | "delivery" }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    const role = normalizeRole(u.role);
    if (variant === "seller") {
      if (role !== "seller") {
        router.replace("/shop");
        return;
      }
      if (u.sellerApproved === true) {
        router.replace("/seller/dashboard");
        return;
      }
    } else {
      if (role !== "delivery") {
        router.replace("/shop");
        return;
      }
      if (u.deliveryAgentApproved === true && u.deliveryAgentActive === true) {
        router.replace("/delivery/dashboard");
        return;
      }
    }
    setReady(true);
  }, [variant, router]);

  async function recheck() {
    setChecking(true);
    try {
      const me = await fetchMe();
      const next = mapAuthUserToStored(me as Record<string, unknown>);
      mergeStoredUser(next);
      router.replace(getPostAuthRedirect(next));
      router.refresh();
    } catch (e) {
      toastApiError(e, "Could not refresh your profile");
    } finally {
      setChecking(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-zinc-50 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  const isSeller = variant === "seller";
  const title = isSeller ? "Seller application received" : "Delivery partner application received";
  const description = isSeller
    ? "Your account is registered as a seller, but an administrator must approve it before you can open the seller dashboard, list products, manage orders, or use seller tools. Once verified in the admin console, use “I was approved” below to continue."
    : "Your account is registered for logistics. An administrator must approve (and usually activate) your profile before the delivery dashboard, assignments, and QR tools are available. When you are active, tap continue below.";

  const cardClass = isSeller
    ? "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/25"
    : "border-sky-200/80 bg-sky-50/50 dark:border-sky-900/50 dark:bg-sky-950/25";

  return (
    <LandingI18nProvider>
      <div className="min-h-svh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/95 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white shadow-md">
                E
              </span>
              EthioLocal
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <nav className="hidden items-center gap-4 sm:flex" aria-label="Page">
                <a href="#status" className={navLinkClass}>
                  Status
                </a>
                <a href="#what-we-offer" className={navLinkClass}>
                  What we offer
                </a>
                <a href="#features" className={navLinkClass}>
                  Features
                </a>
                <a href="#how-it-works" className={navLinkClass}>
                  How it works
                </a>
                <a href="#trust" className={navLinkClass}>
                  Trust
                </a>
              </nav>
              <Link href="/shop" className="text-sm font-medium text-zinc-700 hover:text-amber-800 dark:text-zinc-300">
                Shop
              </Link>
              <LandingThemeToggle />
            </div>
          </div>
        </header>

        <main>
          <section
            id="status"
            className="scroll-mt-24 border-b border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/80 py-14 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-950/80"
          >
            <div className="mx-auto max-w-lg px-4">
              <Card className={cn("rounded-2xl shadow-md", cardClass)}>
                <CardHeader>
                  <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button type="button" className="rounded-xl" disabled={checking} onClick={() => void recheck()}>
                    {checking ? "Checking…" : "I was approved — continue"}
                  </Button>
                  <Button type="button" variant="outline" className="rounded-xl" asChild>
                    <Link href="/shop">Browse shop</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => {
                      clearSession();
                      router.replace("/login");
                      router.refresh();
                    }}
                  >
                    Sign out
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <section
            id="what-we-offer"
            className="scroll-mt-24 border-b border-zinc-200/80 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                What this platform provides
              </p>
              <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                Local markets, transparent pricing, and safe handoffs
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                EthioLocal connects buyers with nearby sellers, helps shoppers compare prices, and secures transactions
                with QR verification at pickup. Sellers and delivery partners get clear workflows for orders, payouts,
                and logistics — so you can focus on service while the platform handles trust and coordination.
              </p>
            </div>
          </section>

          <LandingFeatures />
          <LandingHowItWorks />
          <LandingTrust />
        </main>

        <footer className="border-t border-zinc-200/80 bg-zinc-100/80 py-10 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-zinc-600 dark:text-zinc-400 sm:flex-row sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} EthioLocal</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/" className="font-medium hover:text-amber-800 dark:hover:text-amber-300">
                Home
              </Link>
              <Link href="/shop" className="font-medium hover:text-amber-800 dark:hover:text-amber-300">
                Browse shop
              </Link>
              <Link href="/login" className="font-medium hover:text-amber-800 dark:hover:text-amber-300">
                Sign in
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </LandingI18nProvider>
  );
}
