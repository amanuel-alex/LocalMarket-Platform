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
