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

export function PendingSellerApprovalClient() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const user = getStoredUser();
  const r = normalizeRole(user?.role);

  useEffect(() => {
    if (user && r === "seller" && user.sellerApproved === true) {
      router.replace("/seller/dashboard");
    }
  }, [user, r, router]);

  if (user && r === "seller" && user.sellerApproved === true) {
    return <p className="text-sm text-muted-foreground">Redirecting…</p>;
  }

  async function recheck() {
    setChecking(true);
    try {
      const me = await fetchMe();
      const next = mapAuthUserToStored(me as Record<string, unknown>);
      mergeStoredUser(next);
      if (next.sellerApproved === true) {
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
      <Card className="w-full rounded-2xl border-amber-200/80 bg-amber-50/40 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-xl tracking-tight">Seller application received</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Your account is registered as a seller, but an administrator must approve it before you can list
            products, manage orders, or use seller tools. We will enable access from the admin console when
            your shop is verified.
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
