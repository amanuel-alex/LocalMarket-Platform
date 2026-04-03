"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  clearSession,
  getStoredUser,
  mergeStoredUser,
  type PreferredLocale,
} from "@/lib/auth-storage";
import { fetchMe, patchMeLocale, toastApiError } from "@/lib/api";
import { mapAuthUserToStored } from "@/lib/auth-api";
import { normalizeRole } from "@/lib/roles";
import { Bell, LogOut, Monitor, Moon, Palette, Sun, Users } from "lucide-react";

const NOTIFY_ORDERS_KEY = "ethiolocal_pref_notify_orders";
const NOTIFY_TIPS_KEY = "ethiolocal_pref_notify_tips";

function readBool(key: string, defaultVal: boolean): boolean {
  if (typeof window === "undefined") return defaultVal;
  const v = localStorage.getItem(key);
  if (v === null) return defaultVal;
  return v === "1" || v === "true";
}

function writeBool(key: string, val: boolean) {
  localStorage.setItem(key, val ? "1" : "0");
}

const LOCALES: { value: PreferredLocale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "am", label: "አማርኛ (Amharic)" },
  { value: "om", label: "Afaan Oromoo" },
];

export function SettingsPageClient() {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(getStoredUser());
  const [locale, setLocale] = useState<PreferredLocale>(user?.preferredLocale ?? "en");
  const [localeSaving, setLocaleSaving] = useState(false);
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyTips, setNotifyTips] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNotifyOrders(readBool(NOTIFY_ORDERS_KEY, true));
    setNotifyTips(readBool(NOTIFY_TIPS_KEY, false));
  }, []);

  const refreshUser = useCallback(() => {
    setUser(getStoredUser());
    const u = getStoredUser();
    setLocale(u?.preferredLocale ?? "en");
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) return;
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe();
        if (cancelled) return;
        mergeStoredUser(mapAuthUserToStored(me as Record<string, unknown>));
        refreshUser();
      } catch {
        /* offline or expired token — keep cached user */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  async function onLocaleChange(next: PreferredLocale) {
    const u = getStoredUser();
    if (!u) return;
    setLocale(next);
    setLocaleSaving(true);
    try {
      await patchMeLocale(next);
      mergeStoredUser({ preferredLocale: next });
      refreshUser();
      toast.success("Language saved");
    } catch (e) {
      toast.error(toastApiError(e));
      setLocale(u.preferredLocale ?? "en");
    } finally {
      setLocaleSaving(false);
    }
  }

  function onNotifyOrders(checked: boolean) {
    setNotifyOrders(checked);
    writeBool(NOTIFY_ORDERS_KEY, checked);
    toast.success(checked ? "Order updates enabled" : "Order updates muted");
  }

  function onNotifyTips(checked: boolean) {
    setNotifyTips(checked);
    writeBool(NOTIFY_TIPS_KEY, checked);
    toast.success("Preference saved on this device");
  }

  function handleSignOut() {
    clearSession();
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  if (!user) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Workspace preferences</p>
        </div>
        <Card className="max-w-lg rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Settings apply to your signed-in account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-xl">
              <Link href="/login">Go to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const role = normalizeRole(user.role);
  const isAdmin = role === "admin";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Workspace preferences</p>
      </div>

      <div className="grid max-w-2xl gap-6">
        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
            <CardDescription>Signed-in account (read-only). Contact an admin to change your role.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-mono text-xs font-medium sm:text-sm">{user.phone}</span>
            </div>
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary" className="rounded-lg capitalize">
                {user.role}
              </Badge>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              User ID <span className="font-mono">{user.id}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="size-4 text-muted-foreground" />
              Appearance
            </CardTitle>
            <CardDescription>Theme is stored on this device only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!mounted ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="mr-2 size-4" />
                  Light
                </Button>
                <Button
                  type="button"
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="mr-2 size-4" />
                  Dark
                </Button>
                <Button
                  type="button"
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="mr-2 size-4" />
                  System
                </Button>
              </div>
            )}
            {mounted ? (
              <p className="text-xs text-muted-foreground">
                Active appearance: <span className="font-medium capitalize">{resolvedTheme ?? theme}</span>
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Language</CardTitle>
            <CardDescription>
              Used for API error messages and notification templates. Synced to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="locale" className="text-muted-foreground">
              Preferred locale
            </Label>
            <Select
              value={locale}
              disabled={localeSaving}
              onValueChange={(v) => void onLocaleChange(v as PreferredLocale)}
            >
              <SelectTrigger id="locale" className="max-w-xs rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {LOCALES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="size-4 text-muted-foreground" />
              Notifications
            </CardTitle>
            <CardDescription>
              In-app toasts use your session immediately. Email/SMS delivery is not wired yet — toggles are saved on
              this browser for when those channels ship.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="notify-orders" className="text-base font-medium">
                  Order &amp; payment updates
                </Label>
                <p className="text-sm text-muted-foreground">Ready for push/inbox when enabled on the platform.</p>
              </div>
              <Switch id="notify-orders" checked={notifyOrders} onCheckedChange={onNotifyOrders} />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="notify-tips" className="text-base font-medium">
                  Tips &amp; marketplace news
                </Label>
                <p className="text-sm text-muted-foreground">Occasional product and trust updates.</p>
              </div>
              <Switch id="notify-tips" checked={notifyTips} onCheckedChange={onNotifyTips} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="size-4 text-muted-foreground" />
              Workspace &amp; team
            </CardTitle>
            <CardDescription>
              EthioLocal uses one account per person. There is no separate “team” workspace yet — sellers and staff use
              their own logins.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Need another seller or admin login? Create a user from <strong>Register</strong>, then promote roles from{" "}
              <strong>Admin → Users</strong>.
            </p>
            {isAdmin ? (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link href="/admin/users">Open user management</Link>
              </Button>
            ) : (
              <p>Only administrators can invite or change roles for other accounts.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-destructive/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Session</CardTitle>
            <CardDescription>Sign out on this device. You can also use the profile menu in the header.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={() => handleSignOut()}
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
