import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in — EthioLocal",
  description: "Sign in to the EthioLocal dashboard",
};

export default function LoginPage() {
  return <LoginForm />;
}
