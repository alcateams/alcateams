import { z } from "zod";

export const createCommunityDto = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(1).max(500),
  subGroups: z
    .array(
      z.object({
        name: z.string().min(2).max(50),
        theme: z.string().min(2).max(50),
      }),
    )
    .min(1, "Au moins un sous-groupe est requis"),
});

export type CreateCommunityRequest = z.infer<typeof createCommunityDto>;
