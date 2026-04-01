"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLandingI18n } from "@/lib/i18n/landing-i18n-context";

export function LandingThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { messages } = useLandingI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="size-9 rounded-xl border-zinc-200 dark:border-zinc-700" disabled>
        <Sun className="size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-xl border-zinc-200 bg-white/80 dark:border-zinc-700 dark:bg-zinc-900/80"
          aria-label="Theme"
        >
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[9rem] rounded-xl">
        <DropdownMenuItem className="rounded-lg" onClick={() => setTheme("light")}>
          <Sun className="mr-2 size-4" />
          {messages.header.themeLight}
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-lg" onClick={() => setTheme("dark")}>
          <Moon className="mr-2 size-4" />
          {messages.header.themeDark}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
