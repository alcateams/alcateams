export type CommunityRole = "MODERATOR" | "MEMBER";

export interface ThemeProps {
  id: string;
  name: string;
  rainbowBubbleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityProps {
  id: string;
  name: string;
  description: string;
  themes: ThemeProps[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateThemeProps {
  name: string;
  rainbowBubbleId: string;
}

export interface CreateCommunityProps {
  name: string;
  description: string;
  themes: CreateThemeProps[];
}
