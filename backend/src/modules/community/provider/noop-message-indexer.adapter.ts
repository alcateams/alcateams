import type { MessageIndexerPort } from "./message-indexer.port";

/** Placeholder until message search is implemented: swap in a Meilisearch-backed adapter. */
export class NoopMessageIndexer implements MessageIndexerPort {
  async index(): Promise<void> {}
}
