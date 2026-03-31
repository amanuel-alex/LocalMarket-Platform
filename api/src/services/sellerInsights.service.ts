import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export type SellerInsightsResult = {
  period: { from: string; to: string; days: number };
  summary: {
    completedOrders: number;
    paidAwaitingPickup: number;
    pipelineValue: number;
    revenueCompleted: number;
  };
  /** For charts: one point per calendar day (UTC) with activity. */
  revenueByDay: Array<{ date: string; revenue: number; orderCount: number }>;
};

export async function getSellerInsights(sellerId: string, days = 30): Promise<SellerInsightsResult> {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days);

  const [completed, paidPipeline] = await Promise.all([
    prisma.order.findMany({
      where: {
        sellerId,
        status: "completed",
        updatedAt: { gte: from, lte: to },
      },
      select: { id: true, totalPrice: true, updatedAt: true },
    }),
    prisma.order.findMany({
      where: {
        sellerId,
        status: "paid",
        updatedAt: { gte: from, lte: to },
      },
      select: { totalPrice: true },
    }),
  ]);

  const byDay = new Map<string, { revenue: Prisma.Decimal; orders: number }>();
  for (const o of completed) {
    const d = o.updatedAt.toISOString().slice(0, 10);
    const cur = byDay.get(d) ?? { revenue: new Prisma.Decimal(0), orders: 0 };
    cur.revenue = cur.revenue.plus(o.totalPrice);
    cur.orders += 1;
    byDay.set(d, cur);
  }

  const revenueByDay = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue.toNumber() * 100) / 100,
      orderCount: v.orders,
    }));

  const revenueCompleted = completed.reduce((s, o) => s + o.totalPrice.toNumber(), 0);
  const pipelineValue = paidPipeline.reduce((s, o) => s + o.totalPrice.toNumber(), 0);

  return {
    period: { from: from.toISOString(), to: to.toISOString(), days },
    summary: {
      completedOrders: completed.length,
      paidAwaitingPickup: paidPipeline.length,
      pipelineValue: Math.round(pipelineValue * 100) / 100,
      revenueCompleted: Math.round(revenueCompleted * 100) / 100,
    },
    revenueByDay,
  };
}
