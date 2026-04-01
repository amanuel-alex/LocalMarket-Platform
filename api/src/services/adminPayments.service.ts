import { prisma } from "../prisma/client.js";

export type AdminPaymentRow = {
  id: string;
  status: string;
  amount: number;
  orderId: string;
  orderStatus: string;
  createdAt: string;
  updatedAt: string;
};

export async function listPaymentsForAdmin(
  limit: number,
  offset: number,
): Promise<{ payments: AdminPaymentRow[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        order: { select: { id: true, status: true } },
      },
    }),
    prisma.payment.count(),
  ]);

  return {
    payments: rows.map((p) => ({
      id: p.id,
      status: p.status,
      amount: p.amount.toNumber(),
      orderId: p.orderId,
      orderStatus: p.order.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    total,
  };
}
