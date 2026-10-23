import type { CreateMessageProps, MessageProps, RainbowSyncStatus } from "../domain/message.types";

export interface MessagePage {
  /** Newest first. */
  messages: MessageProps[];
  /** Id to pass as `before` to fetch the next (older) page, or `null` on the last page. */
  nextCursor: string | null;
}

export interface MessageRepositoryPort {
  save(message: CreateMessageProps): Promise<MessageProps>;
  /** Pages through a sub-group's messages, newest first, starting before the `before` message. */
  listBySubGroup(
    subGroupId: string,
    page: { before?: string; limit: number },
  ): Promise<MessagePage>;
  updateRainbowSync(
    messageId: string,
    status: RainbowSyncStatus,
    rainbowMessageId?: string,
  ): Promise<void>;
}
