import { z } from "zod";

export const assistantChatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  /** Optional; required for distance sorting when user asks for “nearby” / “near me”. */
  lat: z.coerce.number().gte(-90).lte(90).optional(),
  lng: z.coerce.number().gte(-180).lte(180).optional(),
});

export type AssistantChatInput = z.infer<typeof assistantChatSchema>;
