import type { CommunityRole } from "../../community/domain/community.types";

export type NotificationType = "ROLE_CHANGED";

/** A notification addressed to a user, enriched with the community name for display. */
export interface NotificationDetails {
  id: string;
  type: NotificationType;
  communityId: string;
  communityName: string;
  role: CommunityRole;
  read: boolean;
  createdAt: Date;
}
