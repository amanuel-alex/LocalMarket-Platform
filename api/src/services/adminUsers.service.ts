import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import * as auditService from "./audit.service.js";

export async function banUserByAdmin(
  adminId: string,
  targetUserId: string,
  reason?: string | null,
): Promise<void> {
  if (adminId === targetUserId) {
    throw new AppError(400, "INVALID_OPERATION", "Cannot ban yourself");
  }
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  if (target.role === "admin") {
    throw new AppError(403, "FORBIDDEN", "Cannot ban an admin account");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetUserId },
      data: {
        bannedAt: new Date(),
        banReason: reason?.slice(0, 2000) ?? null,
      },
    });
    await tx.refreshToken.updateMany({
      where: { userId: targetUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });

  await auditService.recordAudit({
    actorId: adminId,
    action: "user.ban",
    targetType: "User",
    targetId: targetUserId,
    note: reason ?? null,
  });
}

export async function unbanUserByAdmin(adminId: string, targetUserId: string): Promise<void> {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { bannedAt: null, banReason: null },
  });

  await auditService.recordAudit({
    actorId: adminId,
    action: "user.unban",
    targetType: "User",
    targetId: targetUserId,
  });
}
