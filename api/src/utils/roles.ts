import type { Role } from "@prisma/client";

export function isDeliveryRole(role: Role): boolean {
  return role === "delivery" || role === "delivery_agent";
}
