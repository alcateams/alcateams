import { z } from "zod";

export const listMessagesDto = z.object({
  /** Id of the oldest message already loaded: returns the page of messages before it. */
  before: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListMessagesRequest = z.infer<typeof listMessagesDto>;
