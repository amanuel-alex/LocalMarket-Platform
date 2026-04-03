import type { Metadata } from "next";
import Link from "next/link";

import { PartnerRegisterForm } from "@/components/auth/partner-register-form";

export const metadata: Metadata = {
  title: "Apply as delivery partner — EthioLocal",
  description: "Register for delivery — admin approval required",
};

export default function RegisterDeliveryPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <Link href="/" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        ← Back to home
      </Link>
      <PartnerRegisterForm accountType="delivery" />
    </div>
  );
}
