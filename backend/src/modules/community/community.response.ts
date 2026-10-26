import type { Community } from "./domain/community.entity";
import type { CommunityRole, SubGroupKind } from "./domain/community.types";
import type { MessageProps } from "./domain/message.types";
import type { SnippetPart } from "./provider/message-search.port";
import type { MessageSearchPage } from "./queries/search-messages/search-messages.use-case";

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

export interface MessageSearchResultResponse {
  id: string;
  snippet: SnippetPart[];
  author: { id: string; pseudo: string };
  community: { id: string; name: string };
  subGroup: { id: string; name: string };
  createdAt: string;
}

export interface MessageSearchPageResponse {
  results: MessageSearchResultResponse[];
  total: number;
  nextOffset: number | null;
}

export function toMessageSearchPageResponse(page: MessageSearchPage): MessageSearchPageResponse {
  return {
    results: page.results.map((result) => ({
      id: result.id,
      snippet: result.snippet,
      author: { id: result.authorId, pseudo: result.authorPseudo },
      community: { id: result.communityId, name: result.communityName },
      subGroup: { id: result.subGroupId, name: result.subGroupName },
      createdAt: result.createdAt.toISOString(),
    })),
    total: page.total,
    nextOffset: page.nextOffset,
  };
}
