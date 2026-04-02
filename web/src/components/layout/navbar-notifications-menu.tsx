"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchNotificationUnreadCount } from "@/lib/api";
import { cn } from "@/lib/utils";

const POLL_MS = 60_000;

function hasAccessToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("ethiolocal_access_token"));
}

const badgeToneClass = {
  default: "bg-primary text-primary-foreground",
  violet: "bg-violet-600 text-white dark:bg-violet-500",
  cyan: "bg-cyan-600 text-white dark:bg-cyan-500",
} as const;

export type NavbarNotificationsTone = keyof typeof badgeToneClass;

type Props = {
  emptyDescription: string;
  tone?: NavbarNotificationsTone;
  triggerClassName?: string;
};

export function NavbarNotificationsMenu({
  emptyDescription,
  tone = "default",
  triggerClassName,
}: Props) {
  const [unread, setUnread] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!hasAccessToken()) {
      setUnread(0);
      return;
    }
    try {
      const n = await fetchNotificationUnreadCount();
      setUnread(typeof n === "number" && n >= 0 ? n : 0);
    } catch {
      setUnread(0);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), POLL_MS);
    const onFocus = () => void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const count = unread ?? 0;
  const label =
    count > 0 ? `Notifications, ${count} unread` : "Notifications";
  const display = count > 99 ? "99+" : String(count);

  const bell = (
    <>
      <Bell className="size-5" />
      {count > 0 ? (
        <span
          className={cn(
            "pointer-events-none absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none shadow-sm tabular-nums",
            badgeToneClass[tone],
          )}
          aria-hidden
        >
          {display}
        </span>
      ) : null}
    </>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("relative rounded-xl text-muted-foreground hover:text-foreground", triggerClassName)}
          aria-label={label}
        >
          {bell}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="rounded-lg text-muted-foreground">
          {emptyDescription}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
