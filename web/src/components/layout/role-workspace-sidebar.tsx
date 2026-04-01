"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  CreditCard,
  LayoutDashboard,
  Package,
  QrCode,
  Settings,
  ShoppingBag,
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
import { getStoredUser } from "@/lib/auth-storage";
import { normalizeRole, type UserRole } from "@/lib/roles";

type NavItem = { title: string; href: string; icon: typeof LayoutDashboard };

const ADMIN_NAV: NavItem[] = [
  { title: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Payments & commission", href: "/admin/payments", icon: CreditCard },
  { title: "Settings", href: "/settings", icon: Settings },
];

const SELLER_NAV: NavItem[] = [
  { title: "Overview", href: "/seller/dashboard", icon: LayoutDashboard },
  { title: "Products", href: "/seller/products", icon: Package },
  { title: "Orders", href: "/seller/orders", icon: ShoppingCart },
  { title: "Payouts", href: "/seller/payouts", icon: Banknote },
  { title: "QR verify", href: "/seller/qr-verify", icon: QrCode },
  { title: "Settings", href: "/settings", icon: Settings },
];

const DELIVERY_NAV: NavItem[] = [
  { title: "Overview", href: "/delivery/dashboard", icon: LayoutDashboard },
  { title: "QR verify", href: "/delivery/qr-verify", icon: QrCode },
  { title: "Settings", href: "/settings", icon: Settings },
];

const BUYER_NAV: NavItem[] = [
  { title: "Shop", href: "/shop", icon: ShoppingBag },
  { title: "Overview", href: "/account/dashboard", icon: LayoutDashboard },
  { title: "Orders", href: "/account/orders", icon: ShoppingCart },
  { title: "Settings", href: "/settings", icon: Settings },
];

function navForRole(role: UserRole | null): { label: string; items: NavItem[] } {
  switch (role) {
    case "admin":
      return { label: "Admin", items: ADMIN_NAV };
    case "seller":
      return { label: "Seller", items: SELLER_NAV };
    case "delivery":
      return { label: "Delivery", items: DELIVERY_NAV };
    default:
      return { label: "Account", items: BUYER_NAV };
  }
}

export function RoleWorkspaceSidebar() {
  const pathname = usePathname();
  const user = getStoredUser();
  const role = normalizeRole(user?.role);
  const { label, items } = navForRole(role);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border shadow-sm">
      <SidebarHeader className="px-2 pb-2 pt-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-2xl px-2 py-1.5 text-lg font-semibold tracking-tight text-sidebar-foreground outline-none ring-sidebar-ring transition hover:bg-sidebar-accent focus-visible:ring-2"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground shadow-sm">
            E
          </span>
          <span className="group-data-[collapsible=icon]:hidden">EthioLocal</span>
        </Link>
        <p className="px-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden">
          {label} workspace
        </p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
