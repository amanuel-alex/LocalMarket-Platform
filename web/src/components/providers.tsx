"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

import { ThemeToaster } from "@/components/theme-toaster";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="ethiolocal-theme">
      {children}
      <ThemeToaster />
    </ThemeProvider>
  );
}
