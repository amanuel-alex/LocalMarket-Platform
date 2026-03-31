import type { RequestHandler } from "express";
import {
  createDisputeSchema,
  disputeIdParamSchema,
  updateDisputeStatusSchema,
} from "../schemas/dispute.schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as disputeService from "../services/dispute.service.js";

export const create: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = createDisputeSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const dispute = await disputeService.createDispute(req.user!.id, parsed.data);
  res.status(201).json({ dispute });
});

export const list: RequestHandler = asyncHandler(async (req, res) => {
  const disputes = await disputeService.listDisputesForUser(req.user!.id, req.user!.role);
  res.json({ disputes });
});

export const adminUpdateStatus: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsedParams = disputeIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    next(parsedParams.error);
    return;
  }
  const parsedBody = updateDisputeStatusSchema.safeParse(req.body);
  if (!parsedBody.success) {
    next(parsedBody.error);
    return;
  }
  const dispute = await disputeService.updateDisputeStatusByAdmin(parsedParams.data.id, {
    status: parsedBody.data.status,
    note: parsedBody.data.note,
  });
  res.json({ dispute });
});
