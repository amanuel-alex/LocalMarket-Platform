"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { NavbarAccount } from "@/components/layout/navbar-account";
import { NavbarNotificationsMenu } from "@/components/layout/navbar-notifications-menu";
import { Button } from "@/components/ui/button";
import { getStoredUser } from "@/lib/auth-storage";
import { normalizeRole } from "@/lib/roles";

export function ShopChrome({ children }: { children: ReactNode }) {
  const user = getStoredUser();
  const role = normalizeRole(user?.role);

  const accountHref =
    role === "buyer"
      ? "/account/dashboard"
      : role === "seller"
        ? "/seller/dashboard"
        : role === "admin"
          ? "/admin/dashboard"
          : role === "delivery"
            ? "/delivery/dashboard"
            : null;

  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Link href="/shop" className="shrink-0 text-lg font-semibold tracking-tight">
            EthioLocal <span className="text-violet-600">Shop</span>
          </Link>

          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            {role === "buyer" ? (
              <Button variant="ghost" size="sm" className="hidden rounded-xl sm:inline-flex" asChild>
                <Link href="/shop/my-orders">My orders</Link>
              </Button>
            ) : null}
            <NavbarNotificationsMenu
              emptyDescription="Order updates and payment receipts will show here."
              tone="violet"
              triggerClassName="text-muted-foreground"
            />
            <Link
              href="/"
              className="hidden text-sm text-muted-foreground hover:text-foreground lg:inline"
            >
              Home
            </Link>
            {accountHref ? (
              <Link
                href={accountHref}
                className="hidden text-sm font-medium text-primary hover:underline sm:inline"
              >
                Account
              </Link>
            ) : null}
            <NavbarAccount />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
