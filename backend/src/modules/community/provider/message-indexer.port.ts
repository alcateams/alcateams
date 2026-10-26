import type { MessageProps } from "../domain/message.types";

export interface IndexedMessage extends MessageProps {
  communityId: string;
}

/** Feeds posted messages to the full-text search engine (US-081). */
export interface MessageIndexerPort {
  /** Adds the messages to the index, replacing any already indexed under the same id. */
  index(messages: IndexedMessage[]): Promise<void>;
}
