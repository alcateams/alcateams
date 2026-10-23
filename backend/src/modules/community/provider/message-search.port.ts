/** A run of a message excerpt, highlighted when it matches the query. */
export interface SnippetPart {
  text: string;
  highlighted: boolean;
}

export interface MessageSearchHit {
  id: string;
  communityId: string;
  subGroupId: string;
  authorId: string;
  authorPseudo: string;
  createdAt: Date;
  /** Excerpt of the message around the matches. */
  snippet: SnippetPart[];
}

export type MessageSearchSort = "relevance" | "recent";

export interface MessageSearchQuery {
  query: string;
  /** Only messages from these communities are returned. Must not be empty. */
  communityIds: string[];
  /** Narrows the search to one channel. */
  subGroupId?: string;
  sort: MessageSearchSort;
  limit: number;
  offset: number;
}

export interface MessageSearchResult {
  hits: MessageSearchHit[];
  /** Estimated: exact counts are too costly for the search engine on large result sets. */
  total: number;
}

/** Full-text search over indexed messages (US-081). */
export interface MessageSearchPort {
  search(query: MessageSearchQuery): Promise<MessageSearchResult>;
}
