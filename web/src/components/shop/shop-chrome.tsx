"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { NavbarAccount } from "@/components/layout/navbar-account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStoredUser } from "@/lib/auth-storage";
import { normalizeRole } from "@/lib/roles";

export function ShopChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = getStoredUser();
  const role = normalizeRole(user?.role);
  const [q, setQ] = useState("");

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

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    router.push(v ? `/shop?q=${encodeURIComponent(v)}` : "/shop");
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
          <Link href="/shop" className="shrink-0 text-lg font-semibold tracking-tight">
            EthioLocal <span className="text-violet-600">Shop</span>
          </Link>

          <form onSubmit={submitSearch} className="relative mx-auto hidden max-w-md flex-1 min-[480px]:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="h-10 rounded-2xl border-border/80 bg-muted/40 pl-9"
              aria-label="Search marketplace"
            />
          </form>

          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="rounded-xl min-[480px]:hidden" asChild>
              <Link href="/shop" aria-label="Search on shop home">
                <Search className="size-5" />
              </Link>
            </Button>
            {role === "buyer" ? (
              <Button variant="ghost" size="sm" className="hidden rounded-xl sm:inline-flex" asChild>
                <Link href="/shop/my-orders">My orders</Link>
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative rounded-xl text-muted-foreground"
                  aria-label="Notifications"
                >
                  <Bell className="size-5" />
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-violet-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 rounded-2xl">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="rounded-lg text-muted-foreground">
                  Order updates and payment receipts will show here.
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
