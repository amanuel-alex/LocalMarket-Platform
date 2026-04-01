"use client";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DeliveryHomeClient() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Delivery workspace</h1>
        <p className="text-sm text-muted-foreground">Assigned runs, handoffs, and pickup verification</p>
      </div>
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Assigned deliveries</CardTitle>
          <CardDescription>
            Logistics assignment is not wired in this build yet. When your dispatcher assigns orders to your
            account, they will be listed here with status and map links.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild className="rounded-xl">
            <Link href="/delivery/qr-verify">Scan / verify QR</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/shop">Open marketplace (reference)</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
