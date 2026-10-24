import { z } from "zod";
import { GENERAL_CHANNEL, isReservedSubGroupName } from "../../domain/general-channel";

export const createCommunityDto = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(1).max(500),
  isPrivate: z.boolean().default(false),
  subGroups: z
    .array(
      z.object({
        name: z
          .string()
          .min(2)
          .max(50)
          .refine(
            (name) => !isReservedSubGroupName(name),
            `« ${GENERAL_CHANNEL.name} » est réservé au canal général de la communauté`,
          ),
        theme: z.string().min(2).max(50),
      }),
    )
    .min(1, "Au moins un sous-groupe est requis")
    .refine(
      (subGroups) =>
        new Set(subGroups.map((subGroup) => subGroup.name.trim().toLowerCase())).size ===
        subGroups.length,
      "Les noms de sous-groupes doivent être uniques",
    ),
});

export type CreateCommunityRequest = z.infer<typeof createCommunityDto>;
