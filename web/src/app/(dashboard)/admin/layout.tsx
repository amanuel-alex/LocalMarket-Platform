"use client";

import type { ReactNode } from "react";

import { RoleGate } from "@/components/auth/role-gate";

export default function AdminWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate
      allow={["admin"]}
      title="Admin only"
      description="Sign in as an administrator to manage users, commission, and platform controls."
    >
      {children}
    </RoleGate>
  );
}
