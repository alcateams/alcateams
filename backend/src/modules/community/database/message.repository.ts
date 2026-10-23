import type { Prisma } from "../../../generated/prisma/client";
import { database } from "../../../lib/database";
import type { CreateMessageProps, MessageProps, RainbowSyncStatus } from "../domain/message.types";
import type { MessagePage, MessageRepositoryPort } from "./message.repository.port";

const INCLUDE_AUTHOR = { author: { select: { pseudo: true } } } satisfies Prisma.MessageInclude;

type MessageRecord = Prisma.MessageGetPayload<{ include: typeof INCLUDE_AUTHOR }>;

function toProps(record: MessageRecord): MessageProps {
  return {
    id: record.id,
    subGroupId: record.subGroupId,
    authorId: record.authorId,
    authorPseudo: record.author.pseudo,
    text: record.text,
    rainbowSyncStatus: record.rainbowSyncStatus,
    createdAt: record.createdAt,
  };
}

export class MessageRepository implements MessageRepositoryPort {
  async save(message: CreateMessageProps): Promise<MessageProps> {
    const record = await database.message.create({ data: message, include: INCLUDE_AUTHOR });
    return toProps(record);
  }

  async listBySubGroup(
    subGroupId: string,
    { before, limit }: { before?: string; limit: number },
  ): Promise<MessagePage> {
    if (before) {
      // An unknown cursor, or one from another sub-group, yields an empty page rather than an error.
      const cursor = await database.message.findFirst({
        where: { id: before, subGroupId },
        select: { id: true },
      });
      if (!cursor) return { messages: [], nextCursor: null };
    }

    // Fetch one extra row to know whether an older page exists. The id tie-breaker keeps the
    // order stable for messages sharing the same timestamp.
    const records = await database.message.findMany({
      where: { subGroupId },
      include: INCLUDE_AUTHOR,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(before && { cursor: { id: before }, skip: 1 }),
    });

    const hasMore = records.length > limit;
    const page = records.slice(0, limit);
    return {
      messages: page.map(toProps),
      nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async updateRainbowSync(
    messageId: string,
    status: RainbowSyncStatus,
    rainbowMessageId?: string,
  ): Promise<void> {
    await database.message.update({
      where: { id: messageId },
      data: { rainbowSyncStatus: status, rainbowMessageId },
    });
  }
}
