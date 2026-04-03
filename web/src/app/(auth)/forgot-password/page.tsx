import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password — EthioLocal",
  description: "Reset your EthioLocal account password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <ForgotPasswordForm />
    </div>
  );
}
