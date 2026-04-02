"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getStoredUser } from "@/lib/auth-storage";
import { normalizeRole } from "@/lib/roles";

export function StaffWorkspaceApprovalGate({
  kind,
  children,
}: {
  kind: "seller" | "delivery";
  children: ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    const r = normalizeRole(user?.role);
    const pending =
      kind === "seller"
        ? r === "seller" && user?.sellerApproved === false
        : r === "delivery" && user?.deliveryAgentApproved === false;
    if (pending) {
      router.replace(kind === "seller" ? "/seller/pending-approval" : "/delivery/pending-approval");
      return;
    }
    setAllowed(true);
  }, [kind, router]);

  if (allowed !== true) {
    return <p className="text-sm text-muted-foreground">Loading workspace…</p>;
  }
  return <>{children}</>;
}
