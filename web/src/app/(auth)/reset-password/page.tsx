import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Set new password — EthioLocal",
  description: "Choose a new password for your EthioLocal account",
};

function ResetFallback() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 rounded-lg border border-border/60 p-6 shadow-sm">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-4 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <Suspense fallback={<ResetFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
