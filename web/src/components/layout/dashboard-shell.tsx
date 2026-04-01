"use client";

import type { ReactNode } from "react";

import { AppNavbar } from "@/components/layout/app-navbar";
import { RoleWorkspaceSidebar } from "@/components/layout/role-workspace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen>
        <RoleWorkspaceSidebar />
        <SidebarInset className="flex min-h-svh flex-col bg-muted/20">
          <AppNavbar />
          <main className="flex-1 p-4 transition-opacity duration-200 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
