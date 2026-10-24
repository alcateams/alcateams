import type { Community } from "./domain/community.entity";
import type { CommunityRole, SubGroupKind } from "./domain/community.types";
import type { MessageProps } from "./domain/message.types";

export interface SubGroupResponse {
  id: string;
  name: string;
  theme: string;
  kind: SubGroupKind;
}

export interface CommunityResponse {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  subGroups: SubGroupResponse[];
}

export interface CommunityDetailsResponse extends CommunityResponse {
  /** The caller's role in the community. */
  role: CommunityRole;
}

export interface MessageResponse {
  id: string;
  text: string;
  author: { id: string; pseudo: string };
  createdAt: string;
}

/** Maps a domain community to the shape exposed over the HTTP API (no internal fields leaked). */
export function toCommunityResponse(community: Community): CommunityResponse {
  return {
    id: community.id,
    name: community.name,
    description: community.description,
    isPrivate: community.isPrivate,
    subGroups: community.subGroups.map((subGroup) => ({
      id: subGroup.id,
      name: subGroup.name,
      theme: subGroup.theme,
      kind: subGroup.kind,
    })),
  };
}

export function toCommunityDetailsResponse(
  community: Community,
  role: CommunityRole,
): CommunityDetailsResponse {
  return { ...toCommunityResponse(community), role };
}

export function toMessageResponse(message: MessageProps): MessageResponse {
  return {
    id: message.id,
    text: message.text,
    author: { id: message.authorId, pseudo: message.authorPseudo },
    createdAt: message.createdAt.toISOString(),
  };
}
