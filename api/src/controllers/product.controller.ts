import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createProductSchema, productIdParamSchema } from "../schemas/product.schemas.js";
import * as productService from "../services/product.service.js";

export const create: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const sellerId = req.user!.id;
  const product = await productService.createProduct(sellerId, parsed.data);
  res.status(201).json({ product });
});

export const list: RequestHandler = asyncHandler(async (_req, res) => {
  const products = await productService.listProducts();
  res.json({ products });
});

export const getById: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = productIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const product = await productService.getProductById(parsed.data.id);
  res.json({ product });
});
