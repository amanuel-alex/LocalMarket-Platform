"use client";

import { Bell, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppNavbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 shadow-sm backdrop-blur-md sm:gap-4 sm:px-6">
      <SidebarTrigger className="-ml-1 rounded-xl" />

      <div className="relative flex flex-1 max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search orders, products, users…"
          className="h-10 rounded-2xl border-border/80 bg-muted/40 pl-9 shadow-sm placeholder:text-muted-foreground/70"
          aria-label="Search"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative rounded-xl text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" aria-hidden />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="relative h-10 gap-2 rounded-2xl px-2 sm:pr-3"
              aria-label="Open profile menu"
            >
              <Avatar className="size-8 rounded-xl border border-border/80 shadow-sm">
                <AvatarFallback className="rounded-xl bg-muted text-xs font-medium">
                  AD
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">Account</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-lg">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">Signed out</p>
              <p className="text-xs text-muted-foreground">Auth in Step 2</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="rounded-lg">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="rounded-lg">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
