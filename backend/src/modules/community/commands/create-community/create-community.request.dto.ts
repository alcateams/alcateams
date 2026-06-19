import { z } from "zod";

export const createCommunityDto = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(1).max(500),
  themes: z.array(z.string().min(2).max(50)).min(1, "Au moins un thème est requis"),
});

export type CreateCommunityRequest = z.infer<typeof createCommunityDto>;
