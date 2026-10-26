import { z } from "zod";

export const searchMessagesDto = z
  .object({
    q: z.string().trim().min(1).max(200),
    /** Restricts the search to one community; all of the caller's communities otherwise. */
    communityId: z.string().min(1).optional(),
    /** Restricts the search to one channel of `communityId`. */
    subGroupId: z.string().min(1).optional(),
    sort: z.enum(["relevance", "recent"]).default("relevance"),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    offset: z.coerce.number().int().min(0).max(1000).default(0),
  })
  .refine((query) => !query.subGroupId || query.communityId, {
    message: "subGroupId requiert communityId",
    path: ["subGroupId"],
  });

export type SearchMessagesRequest = z.infer<typeof searchMessagesDto>;
