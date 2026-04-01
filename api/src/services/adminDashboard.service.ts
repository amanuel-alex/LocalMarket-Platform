import { prisma } from "../prisma/client.js";
import * as analyticsService from "./analytics.service.js";

export type AdminRecentOrderRow = {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  productTitle: string;
  buyerName: string;
  sellerName: string;
};

export type AdminDashboardPayload = {
  totals: {
    products: number;
    orders: number;
    revenue: number;
    /** Distinct buyers/sellers with order activity in the last 30 days. */
    activeUsersLast30Days: number;
  };
  recentOrders: AdminRecentOrderRow[];
  salesByDay: Array<{ date: string; amount: number }>;
  topProducts: analyticsService.PopularProductRow[];
};

const SALES_DAY_RANGE = 14;

export async function getAdminDashboard(): Promise<AdminDashboardPayload> {
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - SALES_DAY_RANGE);
  from.setUTCHours(0, 0, 0, 0);

  const [productCount, orderCount, salesAgg, recentRaw, paidOrders, analyticsSnap] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { in: ["paid", "completed"] } },
      _sum: { totalPrice: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        product: { select: { title: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
      },
    }),
    prisma.order.findMany({
      where: {
        status: { in: ["paid", "completed"] },
        createdAt: { gte: from },
      },
      select: { totalPrice: true, createdAt: true },
    }),
    analyticsService.getSystemAnalytics(),
  ]);

  const byDay = new Map<string, number>();
  for (const o of paidOrders) {
    const d = o.createdAt.toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + o.totalPrice.toNumber());
  }

  const salesByDay: Array<{ date: string; amount: number }> = [];
  for (let i = 0; i < SALES_DAY_RANGE; i++) {
    const d = new Date(from);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    salesByDay.push({
      date: key,
      amount: Math.round((byDay.get(key) ?? 0) * 100) / 100,
    });
  }

  return {
    totals: {
      products: productCount,
      orders: orderCount,
      revenue: Math.round((salesAgg._sum.totalPrice?.toNumber() ?? 0) * 100) / 100,
      activeUsersLast30Days: analyticsSnap.activeUsersLast30Days,
    },
    recentOrders: recentRaw.map((o) => ({
      id: o.id,
      status: o.status,
      totalPrice: o.totalPrice.toNumber(),
      createdAt: o.createdAt.toISOString(),
      productTitle: o.product.title,
      buyerName: o.buyer.name,
      sellerName: o.seller.name,
    })),
    salesByDay,
    topProducts: analyticsSnap.popularProducts.slice(0, 8),
  };
}
