import { env } from "./env.config";

/** `null` when search is not configured: messages are then not indexed. */
export const meilisearchConfig =
  env.MEILISEARCH_HOST && env.MEILISEARCH_API_KEY
    ? { host: env.MEILISEARCH_HOST.replace(/\/+$/, ""), apiKey: env.MEILISEARCH_API_KEY }
    : null;
