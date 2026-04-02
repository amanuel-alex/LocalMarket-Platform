"use client";

import { Bell, Truck } from "lucide-react";
import Link from "next/link";

import { NavbarAccount } from "@/components/layout/navbar-account";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DeliveryNavbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/90 px-4 shadow-sm backdrop-blur-md sm:gap-4 sm:px-6">
      <SidebarTrigger className="-ml-1 rounded-xl" />

      <Link
        href="/delivery/dashboard"
        className="flex shrink-0 items-center gap-2 rounded-xl px-2 py-1 text-sm font-semibold tracking-tight sm:text-base"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-sm">
          <Truck className="size-4" />
        </span>
        <span className="hidden sm:inline">
          EthioLocal <span className="text-cyan-700 dark:text-cyan-400">Delivery</span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
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
              <span className="absolute right-2 top-2 size-2 rounded-full bg-cyan-500" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 rounded-2xl">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="rounded-lg text-muted-foreground">
              New assignments and route updates will appear here.
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NavbarAccount />
      </div>
    </header>
  );
}
