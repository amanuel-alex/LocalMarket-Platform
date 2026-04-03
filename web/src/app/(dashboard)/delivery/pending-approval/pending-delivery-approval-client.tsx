"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMe, toastApiError } from "@/lib/api";
import { mapAuthUserToStored } from "@/lib/auth-api";
import { clearSession, getStoredUser, mergeStoredUser } from "@/lib/auth-storage";
import { getPostAuthRedirect, normalizeRole } from "@/lib/roles";

export function PendingDeliveryApprovalClient() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const user = getStoredUser();
  const r = normalizeRole(user?.role);

  const deliveryReady =
    r === "delivery" && user?.deliveryAgentApproved === true && user.deliveryAgentActive === true;

  useEffect(() => {
    if (user && deliveryReady) {
      router.replace("/delivery/dashboard");
    }
  }, [user, deliveryReady, router]);

  if (user && deliveryReady) {
    return <p className="text-sm text-muted-foreground">Redirecting…</p>;
  }

  async function recheck() {
    setChecking(true);
    try {
      const me = await fetchMe();
      const next = mapAuthUserToStored(me as Record<string, unknown>);
      mergeStoredUser(next);
      if (next.deliveryAgentApproved === true && next.deliveryAgentActive === true) {
        router.replace(getPostAuthRedirect(next));
        router.refresh();
        return;
      }
    } catch (e) {
      toastApiError(e, "Could not refresh your profile");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg items-center px-4 py-12">
      <Card className="w-full rounded-2xl border-sky-200/80 bg-sky-50/40 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/20">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">Delivery partner application received</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Your account is registered for logistics. An administrator must approve (and usually activate) your
            profile before you can accept assignments or scan pickup QR codes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button type="button" className="rounded-xl" disabled={checking} onClick={() => void recheck()}>
            {checking ? "Checking…" : "I was approved — continue"}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <Link href="/shop">Browse shop</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => {
              clearSession();
              router.replace("/login");
              router.refresh();
            }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
