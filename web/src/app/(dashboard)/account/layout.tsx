"use client";

import type { ReactNode } from "react";

import { RoleGate } from "@/components/auth/role-gate";

export default function BuyerAccountLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate allow={["buyer"]} title="Buyer account" description="Sign in as a customer to manage orders here.">
      {children}
    </RoleGate>
  );
}
