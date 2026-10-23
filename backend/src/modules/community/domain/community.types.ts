export type CommunityRole = "MODERATOR" | "MEMBER";

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
