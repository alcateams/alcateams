import { z } from "zod";

export const sendMessageDto = z.object({
  text: z.string().trim().min(1, "Le message ne peut pas être vide").max(4000),
});

export type SendMessageRequest = z.infer<typeof sendMessageDto>;
