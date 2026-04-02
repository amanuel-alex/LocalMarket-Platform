"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AdminNavbar } from "@/components/admin/admin-navbar";
import { AppNavbar } from "@/components/layout/app-navbar";
import { DeliveryNavbar } from "@/components/delivery/delivery-navbar";
import { SellerNavbar } from "@/components/seller/seller-navbar";
import { RoleWorkspaceSidebar } from "@/components/layout/role-workspace-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminShell = pathname.startsWith("/admin");
  const isSellerShell = pathname.startsWith("/seller");
  const isDeliveryShell = pathname.startsWith("/delivery");

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider defaultOpen>
        <RoleWorkspaceSidebar />
        <SidebarInset className="flex min-h-svh flex-col bg-muted/20">
          {isAdminShell ? (
            <AdminNavbar />
          ) : isSellerShell ? (
            <SellerNavbar />
          ) : isDeliveryShell ? (
            <DeliveryNavbar />
          ) : (
            <AppNavbar />
          )}
          <main className="flex-1 p-4 transition-opacity duration-200 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
