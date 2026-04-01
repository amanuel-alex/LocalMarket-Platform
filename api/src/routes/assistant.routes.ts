import { Router } from "express";
import * as assistantController from "../controllers/assistant.controller.js";
import { assistantOpenAiRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.get("/openai/status", assistantController.openaiStatus);
router.post("/openai/chat", assistantOpenAiRateLimiter, assistantController.openaiChat);
router.post("/chat", assistantController.chat);

export default router;
