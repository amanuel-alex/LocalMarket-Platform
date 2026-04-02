import type { UserStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";

export function isAccountSuspended(row: {
  bannedAt: Date | null;
  status: UserStatus;
}): boolean {
  return row.bannedAt != null || row.status === "blocked";
}

/** Used by auth middleware and optional `checkUserStatus` on sensitive routes. */
export async function assertUserNotSuspended(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bannedAt: true, status: true },
  });
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid session");
  }
  if (isAccountSuspended(user)) {
    throw new AppError(403, "ACCOUNT_BANNED", "This account has been suspended");
  }
}
