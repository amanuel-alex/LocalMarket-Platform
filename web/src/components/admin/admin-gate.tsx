"use client";

import type { ReactNode } from "react";

import { RoleGate } from "@/components/auth/role-gate";

/** @deprecated Prefer `<RoleGate allow={["admin"]}>` or an `admin/layout.tsx` gate. */
export function AdminGate({ children }: { children: ReactNode }) {
  return (
    <RoleGate allow={["admin"]} title="Admin workspace" description="This page is part of the admin console.">
      {children}
    </RoleGate>
  );
}
