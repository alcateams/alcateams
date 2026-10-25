import type { NotificationDetails } from "../domain/notification.types";

export interface NotificationRepositoryPort {
  /** Lists the notifications addressed to a user, most recent first. */
  listForUser(userId: string): Promise<NotificationDetails[]>;
}
