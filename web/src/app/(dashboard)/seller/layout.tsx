"use client";

import type { ReactNode } from "react";

import { RoleGate } from "@/components/auth/role-gate";

export default function SellerWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate
      allow={["seller"]}
      title="Seller workspace"
      description="This area is for seller accounts. Contact an admin if you need the seller role."
    >
      {children}
    </RoleGate>
  );
}
