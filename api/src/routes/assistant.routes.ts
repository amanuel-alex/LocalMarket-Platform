import { Router } from "express";
import * as assistantController from "../controllers/assistant.controller.js";
import {
  assistantGeminiRateLimiter,
  assistantOpenAiRateLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.get("/openai/status", assistantController.openaiStatus);
router.post("/openai/chat", assistantOpenAiRateLimiter, assistantController.openaiChat);
router.get("/gemini/status", assistantController.geminiStatus);
router.post("/gemini/chat", assistantGeminiRateLimiter, assistantController.geminiChat);
router.post("/chat", assistantController.chat);

export default router;
