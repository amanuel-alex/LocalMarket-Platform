import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export async function recordAudit(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  note?: string | null;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      note: input.note ?? null,
      meta: input.meta ?? undefined,
    },
  });
}
