import type { CommunityRole } from "../community/domain/community.types";
import type { NotificationDetails, NotificationType } from "./domain/notification.types";

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  communityId: string;
  communityName: string;
  role: CommunityRole;
  read: boolean;
  createdAt: string;
}

/** Maps a notification to the shape exposed over the HTTP API. */
export function toNotificationResponse(notification: NotificationDetails): NotificationResponse {
  return {
    id: notification.id,
    type: notification.type,
    communityId: notification.communityId,
    communityName: notification.communityName,
    role: notification.role,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}
