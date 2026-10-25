import type { NotificationDetails } from "../../domain/notification.types";
import type { NotificationRepositoryPort } from "../../database/notification.repository.port";

export class ListMyNotificationsUseCase {
  constructor(private readonly notificationRepository: NotificationRepositoryPort) {}

  // Token validation happens upstream in the `requireAuth` middleware; this use case only
  // returns the notifications addressed to the already-authenticated user.
  async execute(userId: string): Promise<NotificationDetails[]> {
    return this.notificationRepository.listForUser(userId);
  }
}
