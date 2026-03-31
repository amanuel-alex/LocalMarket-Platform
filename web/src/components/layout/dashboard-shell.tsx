"use client";

import type { ReactNode } from "react";

import { AppNavbar } from "@/components/layout/app-navbar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <SidebarInset className="flex min-h-svh flex-col bg-muted/20">
          <AppNavbar />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
