import type {
  Community as PrismaCommunity,
  SubGroup as PrismaSubGroup,
} from "../../../generated/prisma/client";
import { Community } from "../domain/community.entity";

type CommunityRecord = PrismaCommunity & { subGroups: PrismaSubGroup[] };

export function toEntity(record: CommunityRecord): Community {
  return new Community({
    id: record.id,
    name: record.name,
    description: record.description,
    subGroups: record.subGroups.map((subGroup) => ({
      id: subGroup.id,
      name: subGroup.name,
      theme: subGroup.theme,
      rainbowBubbleId: subGroup.rainbowBubbleId,
      createdAt: subGroup.createdAt,
      updatedAt: subGroup.updatedAt,
    })),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

/** Builds the nested `create` payload for the community and its sub-groups. */
export function toPersistence(community: Community) {
  return {
    id: community.id,
    name: community.name,
    description: community.description,
    createdAt: community.createdAt,
    updatedAt: community.updatedAt,
    subGroups: {
      create: community.subGroups.map((subGroup) => ({
        id: subGroup.id,
        name: subGroup.name,
        theme: subGroup.theme,
        rainbowBubbleId: subGroup.rainbowBubbleId,
        createdAt: subGroup.createdAt,
        updatedAt: subGroup.updatedAt,
      })),
    },
  };
}
