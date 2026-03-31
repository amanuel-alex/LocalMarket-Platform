import type { Order, OrderStatus, Product, Role } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import type { CreateOrderInput } from "../schemas/order.schemas.js";

type OrderWithProduct = Order & {
  product: Pick<Product, "id" | "title" | "price">;
};

export type OrderJson = {
  id: string;
  status: OrderStatus;
  quantity: number;
  totalPrice: number;
  buyerId: string;
  sellerId: string;
  productId: string;
  product: { id: string; title: string; price: number };
  createdAt: Date;
  updatedAt: Date;
};

function toOrderJson(row: OrderWithProduct): OrderJson {
  return {
    id: row.id,
    status: row.status,
    quantity: row.quantity,
    totalPrice: row.totalPrice.toNumber(),
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    productId: row.productId,
    product: {
      id: row.product.id,
      title: row.product.title,
      price: row.product.price.toNumber(),
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const productSelect = { id: true, title: true, price: true } as const;

export async function createOrder(buyerId: string, input: CreateOrderInput): Promise<OrderJson> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, title: true, price: true, sellerId: true },
  });
  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }

  const totalPrice = product.price.times(input.quantity);

  const row = await prisma.order.create({
    data: {
      buyerId,
      sellerId: product.sellerId,
      productId: product.id,
      quantity: input.quantity,
      totalPrice,
      status: "pending",
    },
    include: { product: { select: productSelect } },
  });

  return toOrderJson(row);
}

export async function listOrdersForUser(userId: string, role: Role): Promise<OrderJson[]> {
  const where =
    role === "admin"
      ? {}
      : role === "seller"
        ? { sellerId: userId }
        : { buyerId: userId };

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { product: { select: productSelect } },
  });

  return rows.map(toOrderJson);
}

export async function getOrderByIdForUser(
  orderId: string,
  userId: string,
  role: Role,
): Promise<OrderJson> {
  const row = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { select: productSelect } },
  });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Order not found");
  }
  const allowed =
    role === "admin" || row.buyerId === userId || row.sellerId === userId;
  if (!allowed) {
    throw new AppError(403, "FORBIDDEN", "You cannot access this order");
  }
  return toOrderJson(row);
}
