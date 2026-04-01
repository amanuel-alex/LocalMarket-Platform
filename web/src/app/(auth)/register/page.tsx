import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register — EthioLocal",
  description: "Create an EthioLocal dashboard account",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
