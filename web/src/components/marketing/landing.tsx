"use client";

import { LandingAiChat } from "@/components/marketing/landing-ai-chat";
import { LandingCta } from "@/components/marketing/landing-cta";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingHeader } from "@/components/marketing/landing-header";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingTrending } from "@/components/marketing/landing-trending";
import { LandingTrust } from "@/components/marketing/landing-trust";
import { LandingCategoriesSection } from "@/components/marketplace/landing-categories-section";
import { LandingShopLocalSection } from "@/components/marketplace/landing-shop-local-section";
import { LandingI18nProvider } from "@/lib/i18n/landing-i18n-context";

function LandingInner() {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_60%_at_50%_-25%,rgba(251,191,36,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_100%_60%_at_50%_-25%,rgba(251,191,36,0.12),transparent_55%)]"
        aria-hidden
      />

      <LandingHeader />
      <main>
        <LandingHero />
        <LandingTrending />
        <LandingCategoriesSection />
        <LandingShopLocalSection />
        <LandingTrust />
        <LandingCta />
      </main>
      <LandingFooter />
      <LandingAiChat />
    </div>
  );
}

export function Landing() {
  return (
    <LandingI18nProvider>
      <LandingInner />
    </LandingI18nProvider>
  );
}
