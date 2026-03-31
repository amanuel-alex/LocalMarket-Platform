import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { nearbyProductsQuerySchema } from "../schemas/location.schemas.js";
import {
  createProductSchema,
  productIdParamSchema,
  productListQuerySchema,
  productSearchQuerySchema,
} from "../schemas/product.schemas.js";
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

export const list: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = productListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const { page, limit } = parsed.data;
  const result = await productService.listProducts({ page, limit });
  res.json(result);
});

export const nearby: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = nearbyProductsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const products = await productService.listNearbyProducts(parsed.data);
  res.json({ products });
});

export const search: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = productSearchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const products = await productService.searchProducts(parsed.data);
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

export const related: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = productIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const products = await productService.listRelatedProducts(parsed.data.id);
  res.json({ products });
});

/** Price comparison: all listings sharing `productGroupId`, sorted by price. */
export const compare: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = productIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const result = await productService.listProductGroupComparisons(parsed.data.id);
  res.json(result);
});
