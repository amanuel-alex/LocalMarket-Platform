"use client";

import { LandingAiChat } from "@/components/marketing/landing-ai-chat";
import { LandingCta } from "@/components/marketing/landing-cta";
import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingHeader } from "@/components/marketing/landing-header";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works";
import { LandingPreview } from "@/components/marketing/landing-preview";
import { LandingTrending } from "@/components/marketing/landing-trending";
import { LandingTrust } from "@/components/marketing/landing-trust";
import { LandingI18nProvider } from "@/lib/i18n/landing-i18n-context";

function LandingInner() {
  return (
    <div className="relative min-h-svh overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(139,92,246,0.11),transparent_50%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgba(139,92,246,0.18),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(99,102,241,0.08),transparent_45%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(99,102,241,0.12),transparent_50%)]"
        aria-hidden
      />

      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingPreview />
        <LandingTrending />
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
