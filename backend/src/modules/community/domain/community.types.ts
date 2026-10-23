export type CommunityRole = "MODERATOR" | "MEMBER";

/** `GENERAL` is the community-wide channel (one per community), `THEMATIC` a regular sub-group. */
export type SubGroupKind = "GENERAL" | "THEMATIC";

export interface SubGroupProps {
  id: string;
  name: string;
  theme: string;
  kind: SubGroupKind;
  rainbowBubbleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityProps {
  id: string;
  name: string;
  description: string;
  subGroups: SubGroupProps[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubGroupProps {
  name: string;
  theme: string;
  kind: SubGroupKind;
  rainbowBubbleId: string;
}

export interface CreateCommunityProps {
  name: string;
  description: string;
  subGroups: CreateSubGroupProps[];
}
