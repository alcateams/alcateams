import { MESSAGES_INDEX, type MeilisearchConfig, meilisearchRequest } from "./meilisearch-http";
import type { IndexedMessage, MessageIndexerPort } from "./message-indexer.port";

/**
 * Search needs: full-text on the body and author, filtering to the communities and channels the
 * searcher can see, and sorting by date. Every attribute stays displayable.
 */
const INDEX_SETTINGS = {
  searchableAttributes: ["text", "authorPseudo"],
  filterableAttributes: ["communityId", "subGroupId", "authorId", "createdAt"],
  sortableAttributes: ["createdAt"],
};

/** What Meilisearch stores for a message. `createdAt` is a Unix timestamp in milliseconds so it
 * can be filtered and sorted on. */
export interface MessageDocument {
  id: string;
  communityId: string;
  subGroupId: string;
  authorId: string;
  authorPseudo: string;
  text: string;
  createdAt: number;
}

export function toMessageDocument(message: IndexedMessage): MessageDocument {
  return {
    id: message.id,
    communityId: message.communityId,
    subGroupId: message.subGroupId,
    authorId: message.authorId,
    authorPseudo: message.authorPseudo,
    text: message.text,
    createdAt: message.createdAt.getTime(),
  };
}

/**
 * Indexes messages in Meilisearch over its REST API. Meilisearch processes writes as
 * asynchronous tasks: a resolved call means the write was accepted, not that it is searchable yet.
 */
export class MeilisearchMessageIndexer implements MessageIndexerPort {
  /** Settings are pushed once per process, before the first documents. */
  private settingsApplied: Promise<void> | null = null;

  constructor(private readonly config: MeilisearchConfig) {}

  async index(messages: IndexedMessage[]): Promise<void> {
    if (messages.length === 0) return;
    await this.applySettings();
    await this.request(
      "ajout des documents",
      "POST",
      `/indexes/${MESSAGES_INDEX}/documents?primaryKey=id`,
      messages.map(toMessageDocument),
    );
  }

  /** Also creates the index if needed. Tasks on an index run in order, so these settings apply
   * before the documents queued after them. */
  private applySettings(): Promise<void> {
    this.settingsApplied ??= this.request(
      "configuration de l'index",
      "PATCH",
      `/indexes/${MESSAGES_INDEX}/settings`,
      INDEX_SETTINGS,
    ).catch((error: unknown) => {
      // Retry on the next call instead of caching the failure.
      this.settingsApplied = null;
      throw error;
    });
    return this.settingsApplied;
  }

  private async request(step: string, method: string, path: string, body: unknown): Promise<void> {
    await meilisearchRequest(this.config, step, method, path, body);
  }
}
