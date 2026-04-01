import { z } from "zod";

export const assistantChatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  /** Optional; required for distance sorting when user asks for “nearby” / “near me”. */
  lat: z.coerce.number().gte(-90).lte(90).optional(),
  lng: z.coerce.number().gte(-180).lte(180).optional(),
});

export type AssistantChatInput = z.infer<typeof assistantChatSchema>;

const chatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

/** Body for OpenAI tool-calling assistant (server keeps API key). */
export const assistantOpenaiChatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  /** Prior turns (client-supplied); latest user text is `message` appended after this. */
  history: z.array(chatTurnSchema).max(24).optional().default([]),
  lat: z.coerce.number().gte(-90).lte(90).optional(),
  lng: z.coerce.number().gte(-180).lte(180).optional(),
});

export type AssistantOpenaiChatInput = z.infer<typeof assistantOpenaiChatSchema>;
