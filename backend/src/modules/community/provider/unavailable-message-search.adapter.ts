import { MessageSearchUnavailableError } from "./message-search.errors";
import type { MessageSearchPort, MessageSearchResult } from "./message-search.port";

/** Used when Meilisearch is not configured. */
export class UnavailableMessageSearch implements MessageSearchPort {
  async search(): Promise<MessageSearchResult> {
    throw new MessageSearchUnavailableError();
  }
}
