import type { Order, Prisma, Product } from "@prisma/client";
import { prisma } from "../prisma/client.js";

const productSelect = { id: true, title: true, price: true } as const;

export type OrderWithProductSummary = Order & {
  product: Pick<Product, "id" | "title" | "price">;
};

export async function findOrdersWithProductForList(
  where: Prisma.OrderWhereInput,
): Promise<OrderWithProductSummary[]> {
  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { product: { select: productSelect } },
  });
}
