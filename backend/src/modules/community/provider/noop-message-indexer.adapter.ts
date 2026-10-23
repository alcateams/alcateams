import type { MessageIndexerPort } from "./message-indexer.port";

/** Used when Meilisearch is not configured: messages are stored but not searchable. */
export class NoopMessageIndexer implements MessageIndexerPort {
  async index(): Promise<void> {}
}
