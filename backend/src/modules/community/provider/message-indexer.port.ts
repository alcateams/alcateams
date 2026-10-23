import type { MessageProps } from "../domain/message.types";

export interface IndexedMessage extends MessageProps {
  communityId: string;
}

/** Feeds posted messages to the full-text search engine (US-081, planned on Meilisearch). */
export interface MessageIndexerPort {
  index(message: IndexedMessage): Promise<void>;
}
