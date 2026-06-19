import type { Community } from "./domain/community.entity";

export interface ThemeResponse {
  id: string;
  name: string;
}

export interface CommunityResponse {
  id: string;
  name: string;
  description: string;
  themes: ThemeResponse[];
}

/** Maps a domain community to the shape exposed over the HTTP API (no internal fields leaked). */
export function toCommunityResponse(community: Community): CommunityResponse {
  return {
    id: community.id,
    name: community.name,
    description: community.description,
    themes: community.themes.map((theme) => ({ id: theme.id, name: theme.name })),
  };
}
