import type { OrderStatus } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";

const productSelect = {
  id: true,
  title: true,
  price: true,
  category: true,
  imageUrl: true,
  lat: true,
  lng: true,
} as const;

const userSelect = { id: true, name: true, phone: true } as const;

export type DeliveryAssignmentJson = {
  id: string;
  status: OrderStatus;
  quantity: number;
  totalPrice: number;
  product: {
    id: string;
    title: string;
    price: number;
    category: string;
    imageUrl: string | null;
    lat: number;
    lng: number;
  };
  buyer: { id: string; name: string; phone: string };
  seller: { id: string; name: string; phone: string };
  pickup: { lat: number; lng: number };
  /** MVP: same coordinates as listing; agents confirm exact drop-off with buyer. */
  dropoff: { lat: number; lng: number; note: string };
  deliveryStartedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Row = Awaited<ReturnType<typeof loadAssignmentRow>>;

async function loadAssignmentRow(orderId: string, agentId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, deliveryAgentId: agentId },
    include: {
      product: { select: productSelect },
      buyer: { select: userSelect },
      seller: { select: userSelect },
    },
  });
}

function toJson(row: NonNullable<Row>): DeliveryAssignmentJson {
  const lat = row.product.lat;
  const lng = row.product.lng;
  return {
    id: row.id,
    status: row.status,
    quantity: row.quantity,
    totalPrice: row.totalPrice.toNumber(),
    product: {
      id: row.product.id,
      title: row.product.title,
      price: row.product.price.toNumber(),
      category: row.product.category,
      imageUrl: row.product.imageUrl,
      lat,
      lng,
    },
    buyer: row.buyer,
    seller: row.seller,
    pickup: { lat, lng },
    dropoff: {
      lat,
      lng,
      note: "Confirm exact drop-off with the buyer. Listing coordinates are the seller pickup point.",
    },
    deliveryStartedAt: row.deliveryStartedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAssignmentsForAgent(agentId: string): Promise<DeliveryAssignmentJson[]> {
  const rows = await prisma.order.findMany({
    where: { deliveryAgentId: agentId },
    orderBy: { updatedAt: "desc" },
    include: {
      product: { select: productSelect },
      buyer: { select: userSelect },
      seller: { select: userSelect },
    },
  });
  return rows.map(toJson);
}

export async function getAssignmentForAgent(
  agentId: string,
  orderId: string,
): Promise<DeliveryAssignmentJson> {
  const row = await loadAssignmentRow(orderId, agentId);
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Assignment not found");
  }
  return toJson(row);
}

export async function startDeliveryAssignment(
  agentId: string,
  orderId: string,
): Promise<DeliveryAssignmentJson> {
  const row = await loadAssignmentRow(orderId, agentId);
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Assignment not found");
  }
  if (row.status !== "paid") {
    throw new AppError(
      409,
      "ORDER_NOT_READY",
      "Start delivery after the buyer has paid — order must be in paid status",
    );
  }
  if (row.deliveryStartedAt) {
    return toJson(row);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { deliveryStartedAt: new Date() },
    include: {
      product: { select: productSelect },
      buyer: { select: userSelect },
      seller: { select: userSelect },
    },
  });
  return toJson(updated);
}
