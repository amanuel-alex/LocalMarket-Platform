import type { Prisma, Role, UserStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import * as auditService from "./audit.service.js";
import { isDeliveryRole } from "../utils/roles.js";

export type AdminUserRow = {
  id: string;
  name: string;
  phone: string;
  role: Role;
  status: UserStatus;
  isVerified: boolean;
  bannedAt: Date | null;
  banReason: string | null;
  createdAt: Date;
};

export type AdminBuyerRow = {
  id: string;
  name: string;
  phone: string;
  status: UserStatus;
  isVerified: boolean;
  bannedAt: Date | null;
  createdAt: Date;
};

export type AdminDeliveryAgentRow = {
  id: string;
  name: string;
  phone: string;
  role: Role;
  isApproved: boolean;
  isActive: boolean;
  status: UserStatus;
  createdAt: Date;
};

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
        status: "blocked",
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
    data: { bannedAt: null, banReason: null, status: "active" },
  });

  await auditService.recordAudit({
    actorId: adminId,
    action: "user.unban",
    targetType: "User",
    targetId: targetUserId,
  });
}

export async function listUsersForAdmin(
  limit: number,
  offset: number,
  filters?: { q?: string; role?: Role },
): Promise<{ users: AdminUserRow[]; total: number }> {
  const where: Prisma.UserWhereInput = {};
  if (filters?.role) {
    where.role = filters.role;
  }
  if (filters?.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        isVerified: true,
        bannedAt: true,
        banReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.user.count({ where }),
  ]);
  return { users, total };
}

export async function patchUserByAdmin(
  adminId: string,
  targetUserId: string,
  body: { role?: Role; active?: boolean },
): Promise<AdminUserRow> {
  if (adminId === targetUserId) {
    if (body.role !== undefined && body.role !== "admin") {
      throw new AppError(400, "INVALID_OPERATION", "Cannot change your own role");
    }
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }

  if (body.active === false) {
    await banUserByAdmin(adminId, targetUserId, "Deactivated by admin");
  } else if (body.active === true) {
    await unbanUserByAdmin(adminId, targetUserId);
  }

  if (body.role !== undefined) {
    if (targetUserId !== adminId && target.role === "admin" && body.role !== "admin") {
      const adminCount = await prisma.user.count({
        where: { role: "admin", bannedAt: null, status: "active" },
      });
      if (adminCount <= 1) {
        throw new AppError(400, "INVALID_OPERATION", "Cannot remove the last admin role");
      }
    }
    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: body.role },
    });
    await auditService.recordAudit({
      actorId: adminId,
      action: "user.role",
      targetType: "User",
      targetId: targetUserId,
      meta: { role: body.role },
    });
  }

  const updated = await prisma.user.findUniqueOrThrow({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      isVerified: true,
      bannedAt: true,
      banReason: true,
      createdAt: true,
    },
  });
  return updated;
}

export async function listBuyersForAdmin(
  limit: number,
  offset: number,
  filters?: { q?: string },
): Promise<{ buyers: AdminBuyerRow[]; total: number }> {
  const where: Prisma.UserWhereInput = { role: "buyer" };
  if (filters?.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  const [buyers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        isVerified: true,
        bannedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.user.count({ where }),
  ]);
  return { buyers, total };
}

export async function patchUserStatusByAdmin(
  adminId: string,
  targetUserId: string,
  status: UserStatus,
): Promise<AdminUserRow> {
  if (adminId === targetUserId) {
    throw new AppError(400, "INVALID_OPERATION", "Cannot change your own status");
  }
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  if (target.role === "admin") {
    throw new AppError(403, "FORBIDDEN", "Cannot change status for an admin account");
  }

  if (status === "blocked") {
    await banUserByAdmin(adminId, targetUserId, "Blocked via admin status");
  } else {
    await unbanUserByAdmin(adminId, targetUserId);
  }

  const updated = await prisma.user.findUniqueOrThrow({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      isVerified: true,
      bannedAt: true,
      banReason: true,
      createdAt: true,
    },
  });

  await auditService.recordAudit({
    actorId: adminId,
    action: "user.status",
    targetType: "User",
    targetId: targetUserId,
    meta: { status },
  });

  return updated;
}

export async function listDeliveryAgentsForAdmin(
  limit: number,
  offset: number,
): Promise<{ agents: AdminDeliveryAgentRow[]; total: number }> {
  const where: Prisma.UserWhereInput = { role: { in: ["delivery", "delivery_agent"] } };
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        deliveryAgentApproved: true,
        deliveryAgentActive: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.user.count({ where }),
  ]);
  const agents: AdminDeliveryAgentRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    role: r.role,
    isApproved: r.deliveryAgentApproved,
    isActive: r.deliveryAgentActive,
    status: r.status,
    createdAt: r.createdAt,
  }));
  return { agents, total };
}

export async function setDeliveryAgentApprovedByAdmin(
  adminId: string,
  agentUserId: string,
  isApproved: boolean,
): Promise<AdminDeliveryAgentRow> {
  const target = await prisma.user.findUnique({ where: { id: agentUserId } });
  if (!target) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  if (!isDeliveryRole(target.role)) {
    throw new AppError(400, "INVALID_OPERATION", "User is not a delivery agent");
  }
  const row = await prisma.user.update({
    where: { id: agentUserId },
    data: { deliveryAgentApproved: isApproved },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      deliveryAgentApproved: true,
      deliveryAgentActive: true,
      status: true,
      createdAt: true,
    },
  });
  await auditService.recordAudit({
    actorId: adminId,
    action: "delivery_agent.approve",
    targetType: "User",
    targetId: agentUserId,
    meta: { isApproved },
  });
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role,
    isApproved: row.deliveryAgentApproved,
    isActive: row.deliveryAgentActive,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export async function setDeliveryAgentActiveByAdmin(
  adminId: string,
  agentUserId: string,
  isActive: boolean,
): Promise<AdminDeliveryAgentRow> {
  const target = await prisma.user.findUnique({ where: { id: agentUserId } });
  if (!target) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }
  if (!isDeliveryRole(target.role)) {
    throw new AppError(400, "INVALID_OPERATION", "User is not a delivery agent");
  }
  const row = await prisma.user.update({
    where: { id: agentUserId },
    data: { deliveryAgentActive: isActive },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      deliveryAgentApproved: true,
      deliveryAgentActive: true,
      status: true,
      createdAt: true,
    },
  });
  await auditService.recordAudit({
    actorId: adminId,
    action: "delivery_agent.activate",
    targetType: "User",
    targetId: agentUserId,
    meta: { isActive },
  });
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role,
    isApproved: row.deliveryAgentApproved,
    isActive: row.deliveryAgentActive,
    status: row.status,
    createdAt: row.createdAt,
  };
}
