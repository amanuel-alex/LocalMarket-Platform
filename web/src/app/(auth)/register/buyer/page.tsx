import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register as buyer — EthioLocal",
  description: "Create a buyer account to shop local markets",
};

export default function RegisterBuyerPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <Link href="/" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        ← Back to home
      </Link>
      <RegisterForm />
    </div>
  );
}
