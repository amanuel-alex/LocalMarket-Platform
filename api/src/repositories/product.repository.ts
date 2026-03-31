import type { Prisma, Product } from "@prisma/client";
import { prisma } from "../prisma/client.js";

const sellerCoordsSelect = { sellerLat: true, sellerLng: true } as const;

export type ProductWithSellerCoords = Prisma.ProductGetPayload<{
  include: { seller: { select: typeof sellerCoordsSelect } };
}>;

export async function countProducts(where?: Prisma.ProductWhereInput): Promise<number> {
  return prisma.product.count({ where });
}

export async function findProductsPaginated(skip: number, take: number): Promise<Product[]> {
  return prisma.product.findMany({
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });
}

export async function findProductById(id: string): Promise<Product | null> {
  return prisma.product.findUnique({ where: { id } });
}

export async function findProductForNewOrder(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, title: true, price: true, sellerId: true },
  });
}

/** Bounded fetch for “nearby” (Haversine still applied in service). Avoids loading unbounded catalog. */
export async function findProductsWithSellerForNearby(
  take: number,
): Promise<ProductWithSellerCoords[]> {
  return prisma.product.findMany({
    take,
    orderBy: { updatedAt: "desc" },
    include: { seller: { select: sellerCoordsSelect } },
  });
}

export async function findProductsForSearch(
  where: Prisma.ProductWhereInput,
  take: number,
): Promise<ProductWithSellerCoords[]> {
  return prisma.product.findMany({
    where,
    include: { seller: { select: sellerCoordsSelect } },
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function findProductGroupById(id: string) {
  return prisma.productGroup.findUnique({ where: { id } });
}

export async function createProductRecord(data: Prisma.ProductUncheckedCreateInput): Promise<Product> {
  return prisma.product.create({ data });
}

export async function findPeerProductsByGroup(
  productGroupId: string,
  excludeProductId: string,
  take: number,
): Promise<Product[]> {
  return prisma.product.findMany({
    where: { productGroupId, id: { not: excludeProductId } },
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function findSimilarInCategoryByPriceBand(
  category: string,
  excludeProductId: string,
  minPrice: Prisma.Decimal,
  maxPrice: Prisma.Decimal,
  take: number,
): Promise<Product[]> {
  return prisma.product.findMany({
    where: {
      category,
      id: { not: excludeProductId },
      price: { gte: minPrice, lte: maxPrice },
    },
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function findProductsInGroupOrderedByPrice(productGroupId: string): Promise<Product[]> {
  return prisma.product.findMany({
    where: { productGroupId },
    orderBy: [{ price: "asc" }, { updatedAt: "desc" }],
  });
}

export async function updateProductGroupId(
  productId: string,
  productGroupId: string | null,
): Promise<Product> {
  return prisma.product.update({
    where: { id: productId },
    data: { productGroupId },
  });
}

export async function createProductGroupRow(label: string | null) {
  return prisma.productGroup.create({
    data: { label },
  });
}
