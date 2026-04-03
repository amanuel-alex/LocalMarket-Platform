"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

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
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname?.includes("/pending-approval")) {
      setAllowed(true);
      return;
    }
    const user = getStoredUser();
    const r = normalizeRole(user?.role);
    const pending =
      kind === "seller"
        ? r === "seller" && user?.sellerApproved === false
        : r === "delivery" &&
          !(user?.deliveryAgentApproved === true && user?.deliveryAgentActive === true);
    if (pending) {
      router.replace(kind === "seller" ? "/seller/pending-approval" : "/delivery/pending-approval");
      return;
    }
    setAllowed(true);
  }, [kind, router, pathname]);

  if (allowed !== true) {
    return <p className="text-sm text-muted-foreground">Loading workspace…</p>;
  }
  return <>{children}</>;
}
