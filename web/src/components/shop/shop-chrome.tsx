"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { NavbarAccount } from "@/components/layout/navbar-account";
import { getStoredUser } from "@/lib/auth-storage";
import { normalizeRole } from "@/lib/roles";

export function ShopChrome({ children }: { children: ReactNode }) {
  const user = getStoredUser();
  const role = normalizeRole(user?.role);
  const accountHref =
    role === "buyer" ? "/account/dashboard" : role === "seller" ? "/seller/dashboard" : role === "admin" ? "/admin/dashboard" : role === "delivery" ? "/delivery/dashboard" : null;

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/shop" className="text-lg font-semibold tracking-tight">
            EthioLocal <span className="text-muted-foreground">Shop</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
              Home
            </Link>
            {accountHref ? (
              <Link href={accountHref} className="text-sm font-medium text-primary hover:underline">
                Workspace
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
