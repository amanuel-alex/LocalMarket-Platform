"use client";

import type { ReactNode } from "react";

import { RoleGate } from "@/components/auth/role-gate";
import { StaffWorkspaceApprovalGate } from "@/components/auth/staff-workspace-approval-gate";

export default function DeliveryWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate
      allow={["delivery"]}
      title="Delivery workspace"
      description="This area is for EthioLocal delivery agents. An administrator can assign the delivery role and link orders to your account."
    >
      <StaffWorkspaceApprovalGate kind="delivery">{children}</StaffWorkspaceApprovalGate>
    </RoleGate>
  );
}
