import { z } from "zod";

export const searchCommunitiesDto = z.object({
  q: z.string().max(100).default(""),
});
