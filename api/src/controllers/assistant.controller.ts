import type { RequestHandler } from "express";
import { assistantChatSchema } from "../schemas/assistant.schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as assistantService from "../services/assistant.service.js";

export const chat: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = assistantChatSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const result = await assistantService.runAssistantChat(parsed.data);
  res.json(result);
});
