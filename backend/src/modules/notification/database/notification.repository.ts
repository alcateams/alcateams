import { database } from "../../../lib/database";
import type { NotificationDetails } from "../domain/notification.types";
import type { NotificationRepositoryPort } from "./notification.repository.port";

export class NotificationRepository implements NotificationRepositoryPort {
  async listForUser(userId: string): Promise<NotificationDetails[]> {
    const records = await database.notification.findMany({
      where: { userId },
      include: { community: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => ({
      id: record.id,
      type: record.type,
      communityId: record.communityId,
      communityName: record.community.name,
      role: record.role,
      read: record.read,
      createdAt: record.createdAt,
    }));
  }
}
