import type { Community } from "./domain/community.entity";
import type { CommunityWithRole } from "./database/community.repository.port";
import type { CommunityMemberDetails, CommunityRole } from "./domain/community.types";

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

export interface CommunityWithRoleResponse extends CommunityResponse {
  myRole: CommunityRole;
}

export interface CommunityMemberResponse {
  userId: string;
  email: string;
  pseudo: string;
  role: CommunityRole;
  joinedAt: string;
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

/** Maps a community the caller belongs to, exposing the role the caller holds in it. */
export function toCommunityWithRoleResponse(entry: CommunityWithRole): CommunityWithRoleResponse {
  return {
    ...toCommunityResponse(entry.community),
    myRole: entry.myRole,
  };
}

/** Maps a community member to the shape exposed to moderators over the HTTP API. */
export function toCommunityMemberResponse(member: CommunityMemberDetails): CommunityMemberResponse {
  return {
    userId: member.userId,
    email: member.email,
    pseudo: member.pseudo,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  };
}
