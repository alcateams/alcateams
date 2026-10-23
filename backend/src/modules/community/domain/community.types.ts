export type CommunityRole = "MODERATOR" | "COMODERATOR" | "MEMBER";

/** All assignable roles, used to validate an incoming role and to iterate over them. */
export const COMMUNITY_ROLES: readonly CommunityRole[] = ["MODERATOR", "COMODERATOR", "MEMBER"];

/** Roles that grant moderation rights (seeing the member list, managing roles). */
export const MODERATION_ROLES: readonly CommunityRole[] = ["MODERATOR", "COMODERATOR"];

/** A community member enriched with the user's public identity, exposed only to moderators. */
export interface CommunityMemberDetails {
  userId: string;
  email: string;
  pseudo: string;
  role: CommunityRole;
  joinedAt: Date;
}

export interface SubGroupProps {
  id: string;
  name: string;
  theme: string;
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
  rainbowBubbleId: string;
}

export interface CreateCommunityProps {
  name: string;
  description: string;
  subGroups: CreateSubGroupProps[];
}
