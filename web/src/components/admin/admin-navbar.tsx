"use client";

import { NavbarAccount } from "@/components/layout/navbar-account";
import { NavbarNotificationsMenu } from "@/components/layout/navbar-notifications-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AdminNavbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/90 px-4 shadow-sm backdrop-blur-md sm:gap-4 sm:px-6">
      <SidebarTrigger className="-ml-1 rounded-xl" />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <NavbarNotificationsMenu
          emptyDescription="No new alerts. Order and payout events will appear here."
          tone="default"
        />

        <NavbarAccount />
      </div>
    </header>
  );
}
