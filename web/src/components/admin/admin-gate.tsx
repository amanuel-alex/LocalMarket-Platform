"use client";

import Link from "next/link";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredUser } from "@/lib/auth-storage";

export function AdminGate({ children }: { children: ReactNode }) {
  const user = getStoredUser();
  if (!user) {
    return (
      <Card className="max-w-md rounded-2xl">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Admin area requires authentication.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="rounded-xl">
            <Link href="/login">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (user.role !== "admin") {
    return (
      <Card className="max-w-md rounded-2xl border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle>Admin only</CardTitle>
          <CardDescription>This page is restricted to administrators.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return <>{children}</>;
}
