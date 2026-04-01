import type { RequestHandler } from "express";
import { assistantChatSchema, assistantOpenaiChatSchema } from "../schemas/assistant.schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as assistantOpenAiService from "../services/assistant.openai.service.js";
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

export const openaiStatus: RequestHandler = asyncHandler(async (_req, res) => {
  res.json({ enabled: assistantOpenAiService.isOpenAiAssistantEnabled() });
});

export const openaiChat: RequestHandler = asyncHandler(async (req, res, next) => {
  const parsed = assistantOpenaiChatSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const result = await assistantOpenAiService.runOpenAiAssistantChat(parsed.data);
  res.json({
    reply: result.reply,
    model: result.model,
    usage: result.usage,
  });
});
