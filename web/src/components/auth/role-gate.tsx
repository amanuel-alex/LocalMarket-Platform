"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredUser } from "@/lib/auth-storage";
import { getWorkspaceHomePath, normalizeRole, type UserRole } from "@/lib/roles";

type RoleGateProps = {
  allow: readonly UserRole[];
  title?: string;
  description?: string;
  children: ReactNode;
};

export function RoleGate({ allow, title = "Access restricted", description, children }: RoleGateProps) {
  const user = getStoredUser();
  const role = normalizeRole(user?.role);

  if (!user) {
    return (
      <Card className="max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>This area requires an account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-xl">
            <Link href="/login">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!role || !allow.includes(role)) {
    const home = getWorkspaceHomePath(user.role);
    return (
      <Card className="max-w-md rounded-2xl border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {description ??
              "Your account type does not include this workspace. Use the link below to open your home area."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="default" className="rounded-xl">
            <Link href={home}>Go to your home</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/shop">Browse shop</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
