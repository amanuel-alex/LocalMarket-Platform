import type { Dispute, DisputeStatus, Role } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import type { CreateDisputeInput, UpdateDisputeStatusInput } from "../schemas/dispute.schemas.js";

const ACTIVE_DISPUTE: DisputeStatus[] = ["open", "reviewing"];

export type DisputeJson = {
  id: string;
  orderId: string;
  reason: string;
  status: DisputeStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toJson(row: Dispute): DisputeJson {
  return {
    id: row.id,
    orderId: row.orderId,
    reason: row.reason,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createDispute(buyerId: string, input: CreateDisputeInput): Promise<DisputeJson> {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) {
    throw new AppError(404, "NOT_FOUND", "Order not found");
  }
  if (order.buyerId !== buyerId) {
    throw new AppError(403, "FORBIDDEN", "You can only open a dispute on your own orders");
  }
  if (order.status === "pending") {
    throw new AppError(409, "ORDER_NOT_PAYABLE", "Disputes apply after the order is paid");
  }
  if (order.status === "cancelled") {
    throw new AppError(409, "ORDER_NOT_PAYABLE", "Disputes do not apply to cancelled orders");
  }

  const active = await prisma.dispute.findFirst({
    where: {
      orderId: input.orderId,
      status: { in: ACTIVE_DISPUTE },
    },
  });
  if (active) {
    throw new AppError(409, "DISPUTE_EXISTS", "An open dispute already exists for this order");
  }

  const row = await prisma.dispute.create({
    data: {
      orderId: input.orderId,
      reason: input.reason,
      status: "open",
    },
  });
  return toJson(row);
}

export async function listDisputesForUser(userId: string, role: Role): Promise<DisputeJson[]> {
  const where =
    role === "admin"
      ? {}
      : role === "seller"
        ? { order: { sellerId: userId } }
        : { order: { buyerId: userId } };

  const rows = await prisma.dispute.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toJson);
}

export async function updateDisputeStatusByAdmin(
  disputeId: string,
  input: UpdateDisputeStatusInput,
): Promise<DisputeJson> {
  const row = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Dispute not found");
  }
  const note =
    input.note === undefined ? undefined : input.note === "" ? null : input.note;
  const updated = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: input.status,
      ...(note !== undefined ? { note } : {}),
    },
  });
  return toJson(updated);
}
