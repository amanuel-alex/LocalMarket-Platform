import type { Prisma, Product } from "@prisma/client";
import { prisma } from "../prisma/client.js";

const sellerCoordsSelect = { sellerLat: true, sellerLng: true } as const;

/** Fields needed for API product JSON (smaller rows from Postgres). */
export const productCatalogSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  category: true,
  lat: true,
  lng: true,
  imageUrl: true,
  productGroupId: true,
  sellerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ProductCatalogRecord = Prisma.ProductGetPayload<{ select: typeof productCatalogSelect }>;

export type ProductWithSellerCoords = Prisma.ProductGetPayload<{
  include: { seller: { select: typeof sellerCoordsSelect } };
}>;

export async function countProducts(where?: Prisma.ProductWhereInput): Promise<number> {
  return prisma.product.count({ where });
}

export async function findProductsPaginated(
  skip: number,
  take: number,
  opts?: {
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  },
): Promise<ProductCatalogRecord[]> {
  return prisma.product.findMany({
    where: opts?.where,
    orderBy: opts?.orderBy ?? { createdAt: "desc" },
    skip,
    take,
    select: productCatalogSelect,
  });
}

export async function findProductById(id: string): Promise<ProductCatalogRecord | null> {
  return prisma.product.findUnique({
    where: { id },
    select: productCatalogSelect,
  });
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
): Promise<ProductCatalogRecord[]> {
  return prisma.product.findMany({
    where: { productGroupId, id: { not: excludeProductId } },
    orderBy: { updatedAt: "desc" },
    take,
    select: productCatalogSelect,
  });
}

export async function findSimilarInCategoryByPriceBand(
  category: string,
  excludeProductId: string,
  minPrice: Prisma.Decimal,
  maxPrice: Prisma.Decimal,
  take: number,
): Promise<ProductCatalogRecord[]> {
  return prisma.product.findMany({
    where: {
      category,
      id: { not: excludeProductId },
      price: { gte: minPrice, lte: maxPrice },
    },
    orderBy: { updatedAt: "desc" },
    take,
    select: productCatalogSelect,
  });
}

export async function findProductsInGroupOrderedByPrice(
  productGroupId: string,
): Promise<ProductCatalogRecord[]> {
  return prisma.product.findMany({
    where: { productGroupId },
    orderBy: [{ price: "asc" }, { updatedAt: "desc" }],
    select: productCatalogSelect,
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
