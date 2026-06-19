import type { Community } from "./domain/community.entity";

export interface SubGroupResponse {
  id: string;
  name: string;
  theme: string;
}

export interface CommunityResponse {
  id: string;
  name: string;
  description: string;
  subGroups: SubGroupResponse[];
}

/** Maps a domain community to the shape exposed over the HTTP API (no internal fields leaked). */
export function toCommunityResponse(community: Community): CommunityResponse {
  return {
    id: community.id,
    name: community.name,
    description: community.description,
    subGroups: community.subGroups.map((subGroup) => ({
      id: subGroup.id,
      name: subGroup.name,
      theme: subGroup.theme,
    })),
  };
}
