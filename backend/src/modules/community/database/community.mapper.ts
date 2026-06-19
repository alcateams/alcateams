import type {
  Community as PrismaCommunity,
  Theme as PrismaTheme,
} from "../../../generated/prisma/client";
import { Community } from "../domain/community.entity";

type CommunityRecord = PrismaCommunity & { themes: PrismaTheme[] };

export function toEntity(record: CommunityRecord): Community {
  return new Community({
    id: record.id,
    name: record.name,
    description: record.description,
    themes: record.themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      rainbowBubbleId: theme.rainbowBubbleId,
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
    })),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

/** Builds the nested `create` payload for the community and its themes. */
export function toPersistence(community: Community) {
  return {
    id: community.id,
    name: community.name,
    description: community.description,
    createdAt: community.createdAt,
    updatedAt: community.updatedAt,
    themes: {
      create: community.themes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        rainbowBubbleId: theme.rainbowBubbleId,
        createdAt: theme.createdAt,
        updatedAt: theme.updatedAt,
      })),
    },
  };
}
