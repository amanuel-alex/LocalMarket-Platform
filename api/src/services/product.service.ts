import { prisma } from "../prisma/client.js";
import { AppError } from "../utils/errors.js";
import type { CreateProductInput } from "../schemas/product.schemas.js";
import type { Product } from "@prisma/client";

export type ProductJson = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: { lat: number; lng: number };
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
};

function toProductJson(row: Product): ProductJson {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price.toNumber(),
    category: row.category,
    location: { lat: row.lat, lng: row.lng },
    sellerId: row.sellerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function createProduct(sellerId: string, input: CreateProductInput): Promise<ProductJson> {
  const row = await prisma.product.create({
    data: {
      title: input.title,
      description: input.description,
      price: input.price,
      category: input.category,
      lat: input.location.lat,
      lng: input.location.lng,
      sellerId,
    },
  });
  return toProductJson(row);
}

export async function listProducts(): Promise<ProductJson[]> {
  const rows = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toProductJson);
}

export async function getProductById(id: string): Promise<ProductJson> {
  const row = await prisma.product.findUnique({ where: { id } });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Product not found");
  }
  return toProductJson(row);
}
