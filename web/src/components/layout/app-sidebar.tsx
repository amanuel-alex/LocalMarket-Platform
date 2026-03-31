"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  LayoutDashboard,
  Package,
  QrCode,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const nav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Products", href: "/products", icon: Package },
  { title: "Orders", href: "/orders", icon: ShoppingCart },
  { title: "Payments", href: "/payments", icon: CreditCard },
  { title: "QR Verify", href: "/qr-verify", icon: QrCode },
  { title: "Users", href: "/users", icon: Users },
  { title: "Settings", href: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-sm">
      <SidebarHeader className="px-2 pb-2 pt-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-2xl px-2 py-1.5 text-lg font-semibold tracking-tight text-sidebar-foreground outline-none ring-sidebar-ring transition hover:bg-sidebar-accent focus-visible:ring-2"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground shadow-sm">
            E
          </span>
          <span className="group-data-[collapsible=icon]:hidden">EthioLocal</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={active}
                      className="rounded-xl data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium"
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
