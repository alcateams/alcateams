import { meilisearchConfig } from "../../../config/meilisearch.config";
import { MeilisearchMessageIndexer } from "./meilisearch-message-indexer.adapter";
import { MeilisearchMessageSearch } from "./meilisearch-message-search.adapter";
import type { MessageIndexerPort } from "./message-indexer.port";
import type { MessageSearchPort } from "./message-search.port";
import { NoopMessageIndexer } from "./noop-message-indexer.adapter";
import { UnavailableMessageSearch } from "./unavailable-message-search.adapter";

let warned = false;
function warnIfDisabled() {
  if (meilisearchConfig || warned) return;
  warned = true;
  console.warn(
    "[search] MEILISEARCH_HOST/MEILISEARCH_API_KEY absents : messages non indexés, recherche indisponible.",
  );
}

export function createMessageIndexer(): MessageIndexerPort {
  warnIfDisabled();
  return meilisearchConfig
    ? new MeilisearchMessageIndexer(meilisearchConfig)
    : new NoopMessageIndexer();
}

export function createMessageSearch(): MessageSearchPort {
  warnIfDisabled();
  return meilisearchConfig
    ? new MeilisearchMessageSearch(meilisearchConfig)
    : new UnavailableMessageSearch();
}
