import type { StoredUser } from "@/lib/auth-storage";

/** Mirrors API `Role` enum (Prisma). */
export const USER_ROLES = ["buyer", "seller", "admin", "delivery"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function normalizeRole(role: string | undefined | null): UserRole | null {
  if (!role) return null;
  const r = role.toLowerCase().trim();
  /** API may return `delivery_agent`; UI buckets it with delivery staff. */
  if (r === "delivery_agent") return "delivery";
  if (USER_ROLES.includes(r as UserRole)) return r as UserRole;
  return null;
}

/** First screen after sign-in (buyers land in the storefront, not the staff console). */
export function getPostLoginPath(role: string): string {
  const r = normalizeRole(role);
  if (!r) return "/login";
  switch (r) {
    case "admin":
      return "/admin/dashboard";
    case "seller":
      return "/seller/dashboard";
    case "delivery":
      return "/delivery/dashboard";
    default:
      return "/shop";
  }
}

/**
 * After login/register: staff self-signups stay on a waiting screen until approved.
 * `sellerApproved` / `deliveryAgentApproved` come from the API user payload.
 */
export function getPostAuthRedirect(user: StoredUser): string {
  const r = normalizeRole(user.role);
  if (!r) return "/login";

  if (r === "seller" && user.sellerApproved === false) {
    return "/seller/pending-approval";
  }
  if (r === "delivery" && user.deliveryAgentApproved === false) {
    return "/delivery/pending-approval";
  }

  return getPostLoginPath(user.role);
}

/** Default home inside the role workspace (sidebar shell). */
export function getWorkspaceHomePath(role: string): string {
  const r = normalizeRole(role);
  if (!r) return "/login";
  switch (r) {
    case "admin":
      return "/admin/dashboard";
    case "seller":
      return "/seller/dashboard";
    case "delivery":
      return "/delivery/dashboard";
    default:
      return "/account/dashboard";
  }
}

export function isStaffRole(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "seller" || r === "delivery";
}
