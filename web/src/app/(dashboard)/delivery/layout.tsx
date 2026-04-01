"use client";

import type { ReactNode } from "react";

import { RoleGate } from "@/components/auth/role-gate";

export default function DeliveryWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate
      allow={["delivery"]}
      title="Delivery workspace"
      description="This area is for delivery agents. Ask an administrator to assign the delivery role."
    >
      {children}
    </RoleGate>
  );
}
