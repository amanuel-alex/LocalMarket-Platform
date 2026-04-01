import { OrderStatus, Role } from "@prisma/client";
import { z } from "zod";

export const logQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type LogQuery = z.infer<typeof logQuerySchema>;

export const metricsWindowQuerySchema = z.object({
  windowHours: z.coerce.number().int().min(1).max(168).optional().default(24),
});

export type MetricsWindowQuery = z.infer<typeof metricsWindowQuerySchema>;

export const userIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const adminCommissionBodySchema = z.object({
  commissionRateBps: z.coerce.number().int().min(0).max(10_000),
});

export const adminBanBodySchema = z.object({
  reason: z.string().max(2000).optional(),
});

export const adminOrderOverrideBodySchema = z
  .object({
    status: z.nativeEnum(OrderStatus).optional(),
    clearPickupQr: z.boolean().optional(),
    adminNote: z.string().max(4000).optional(),
  })
  .superRefine((data, ctx) => {
    const hasPatch =
      data.status !== undefined ||
      data.clearPickupQr === true ||
      data.adminNote !== undefined;
    if (!hasPatch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one of: status, clearPickupQr, adminNote",
      });
    }
  });

export const adminCreateProductGroupBodySchema = z.object({
  label: z.string().trim().max(200).optional(),
});

export const adminAssignProductGroupBodySchema = z.object({
  productGroupId: z.string().cuid().nullable(),
});

export const adminUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const adminUserPatchBodySchema = z
  .object({
    role: z.nativeEnum(Role).optional(),
    /** `true` = active (unban), `false` = suspended (ban). */
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === undefined && data.active === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one of: role, active",
      });
    }
  });

export const adminPaymentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
