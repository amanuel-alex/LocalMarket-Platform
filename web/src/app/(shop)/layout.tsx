import type { ReactNode } from "react";

import { ShopChrome } from "@/components/shop/shop-chrome";
import { LandingI18nProvider } from "@/lib/i18n/landing-i18n-context";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <LandingI18nProvider>
      <ShopChrome>{children}</ShopChrome>
    </LandingI18nProvider>
  );
}
