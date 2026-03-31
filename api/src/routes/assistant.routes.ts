import { Router } from "express";
import * as assistantController from "../controllers/assistant.controller.js";

const router = Router();

router.post("/chat", assistantController.chat);

export default router;
