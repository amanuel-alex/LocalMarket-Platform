import { prisma } from "../prisma/client.js";

const ACTIVE_USER_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type PopularProductRow = {
  productId: string;
  title: string;
  orderCount: number;
  unitsSold: number;
};

export type SystemAnalytics = {
  totalSales: number;
  activeUsersLast30Days: number;
  popularProducts: PopularProductRow[];
};

export async function getSystemAnalytics(): Promise<SystemAnalytics> {
  const [salesAgg, grouped, recentOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: ["paid", "completed"] } },
      _sum: { totalPrice: true },
    }),
    prisma.order.groupBy({
      by: ["productId"],
      _count: { id: true },
      _sum: { quantity: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - ACTIVE_USER_WINDOW_MS) },
      },
      select: { buyerId: true, sellerId: true },
    }),
  ]);

  const activeIds = new Set<string>();
  for (const o of recentOrders) {
    activeIds.add(o.buyerId);
    activeIds.add(o.sellerId);
  }

  const productIds = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true },
  });
  const titleById = new Map(products.map((p) => [p.id, p.title]));

  const popularProducts: PopularProductRow[] = grouped.map((g) => ({
    productId: g.productId,
    title: titleById.get(g.productId) ?? "(removed)",
    orderCount: g._count.id,
    unitsSold: g._sum.quantity ?? 0,
  }));

  return {
    totalSales: salesAgg._sum.totalPrice?.toNumber() ?? 0,
    activeUsersLast30Days: activeIds.size,
    popularProducts,
  };
}
