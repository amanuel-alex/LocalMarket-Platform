"use client";

import { Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { NavbarAccount } from "@/components/layout/navbar-account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SellerNavbar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    if (v) router.push(`/seller/products?q=${encodeURIComponent(v)}`);
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/90 px-4 shadow-sm backdrop-blur-md sm:gap-4 sm:px-6">
      <SidebarTrigger className="-ml-1 rounded-xl" />

      <form onSubmit={submitSearch} className="relative flex flex-1 max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Search your products…"
          className="h-10 rounded-2xl border-border/80 bg-muted/40 pl-9 shadow-sm placeholder:text-muted-foreground/70"
          aria-label="Search products"
        />
      </form>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative rounded-xl text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-violet-500"
                aria-hidden
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 rounded-2xl">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="rounded-lg text-muted-foreground">
              New orders and payout updates will appear here.
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NavbarAccount />
      </div>
    </header>
  );
}
