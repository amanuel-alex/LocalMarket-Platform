import { DisputeStatus } from "@prisma/client";
import { z } from "zod";

export const createDisputeSchema = z.object({
  orderId: z.string().cuid(),
  reason: z.string().trim().min(1).max(4000),
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;

export const disputeIdParamSchema = z.object({
  id: z.string().cuid(),
});

export const updateDisputeStatusSchema = z.object({
  status: z.nativeEnum(DisputeStatus),
  note: z.string().trim().max(4000).nullish(),
});

export type UpdateDisputeStatusInput = z.infer<typeof updateDisputeStatusSchema>;
