import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-background px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-xl font-semibold tracking-tight text-foreground transition hover:text-foreground/80"
      >
        EthioLocal
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
