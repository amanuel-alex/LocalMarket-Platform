"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getStoredUser } from "@/lib/auth-storage";
import { getPostAuthRedirect, getPostLoginPath, normalizeRole } from "@/lib/roles";

function Redirecting() {
  return <p className="text-sm text-muted-foreground">Redirecting…</p>;
}

export function DashboardEntryRedirect() {
  const router = useRouter();
  useEffect(() => {
    const u = getStoredUser();
    router.replace(u ? getPostAuthRedirect(u) : "/login");
  }, [router]);
  return <Redirecting />;
}

export function ProductsLegacyRedirect() {
  const router = useRouter();
  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    router.replace(normalizeRole(u.role) === "seller" ? "/seller/products" : "/shop");
  }, [router]);
  return <Redirecting />;
}

export function OrdersLegacyRedirect() {
  const router = useRouter();
  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    const r = normalizeRole(u.role);
    if (r === "buyer") router.replace("/account/orders");
    else if (r === "seller") router.replace("/seller/orders");
    else if (r === "admin") router.replace("/admin/dashboard");
    else if (r === "delivery") router.replace("/delivery/dashboard");
    else router.replace("/shop");
  }, [router]);
  return <Redirecting />;
}

export function PaymentsLegacyRedirect() {
  const router = useRouter();
  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    router.replace(normalizeRole(u.role) === "admin" ? "/admin/payments" : getPostLoginPath(u.role));
  }, [router]);
  return <Redirecting />;
}

export function UsersLegacyRedirect() {
  const router = useRouter();
  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    router.replace(normalizeRole(u.role) === "admin" ? "/admin/users" : getPostLoginPath(u.role));
  }, [router]);
  return <Redirecting />;
}

export function QrLegacyRedirect() {
  const router = useRouter();
  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    const r = normalizeRole(u.role);
    if (r === "seller") router.replace("/seller/qr-verify");
    else if (r === "delivery") router.replace("/delivery/qr-verify");
    else router.replace(getPostLoginPath(u.role));
  }, [router]);
  return <Redirecting />;
}
