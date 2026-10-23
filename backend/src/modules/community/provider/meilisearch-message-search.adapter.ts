import { MessagesIndexSetup } from "./meilisearch-message-indexer.adapter";
import { MESSAGES_INDEX, type MeilisearchConfig, meilisearchRequest } from "./meilisearch-http";
import type { MessageDocument } from "./meilisearch-message-indexer.adapter";
import { MessageSearchUnavailableError } from "./message-search.errors";
import type {
  MessageSearchHit,
  MessageSearchPort,
  MessageSearchQuery,
  MessageSearchResult,
  SnippetPart,
} from "./message-search.port";

// Private-use characters: they can't be confused with markup, and the client never sees them.
const HIGHLIGHT_START = "\uE000";
const HIGHLIGHT_END = "\uE001";
/** Words kept around the matches in a snippet. */
const SNIPPET_WORDS = 30;

interface SearchResponse {
  hits: (MessageDocument & { _formatted?: { text?: string } })[];
  estimatedTotalHits?: number;
}

/** Quotes a value for a Meilisearch filter expression. */
const quote = (value: string) => JSON.stringify(value);

export function buildFilter(query: Pick<MessageSearchQuery, "communityIds" | "subGroupId">) {
  const filters = [`communityId IN [${query.communityIds.map(quote).join(", ")}]`];
  if (query.subGroupId) filters.push(`subGroupId = ${quote(query.subGroupId)}`);
  return filters;
}

/** Splits a Meilisearch-formatted string on the highlight markers. */
export function toSnippet(formatted: string): SnippetPart[] {
  const parts: SnippetPart[] = [];
  for (const [index, chunk] of formatted.split(HIGHLIGHT_START).entries()) {
    // Every chunk after the first opens with a highlighted run.
    const end = chunk.indexOf(HIGHLIGHT_END);
    const [highlighted, rest] =
      index === 0
        ? ["", chunk]
        : end === -1
          ? [chunk, ""]
          : [chunk.slice(0, end), chunk.slice(end + 1)];
    if (highlighted) parts.push({ text: highlighted, highlighted: true });
    if (rest) parts.push({ text: rest.replaceAll(HIGHLIGHT_END, ""), highlighted: false });
  }
  return parts;
}

export class MeilisearchMessageSearch implements MessageSearchPort {
  private readonly setup: MessagesIndexSetup;

  constructor(private readonly config: MeilisearchConfig) {
    this.setup = new MessagesIndexSetup(config);
  }

  async search(query: MessageSearchQuery): Promise<MessageSearchResult> {
    if (query.communityIds.length === 0) return { hits: [], total: 0 };

    const response = await this.request({
      q: query.query,
      filter: buildFilter(query),
      ...(query.sort === "recent" && { sort: ["createdAt:desc"] }),
      limit: query.limit,
      offset: query.offset,
      attributesToCrop: ["text"],
      cropLength: SNIPPET_WORDS,
      attributesToHighlight: ["text"],
      highlightPreTag: HIGHLIGHT_START,
      highlightPostTag: HIGHLIGHT_END,
    });

    return {
      hits: response.hits.map(
        (hit): MessageSearchHit => ({
          id: hit.id,
          communityId: hit.communityId,
          subGroupId: hit.subGroupId,
          authorId: hit.authorId,
          authorPseudo: hit.authorPseudo,
          createdAt: new Date(hit.createdAt),
          snippet: toSnippet(hit._formatted?.text ?? hit.text),
        }),
      ),
      total: response.estimatedTotalHits ?? response.hits.length,
    };
  }

  /** Engine failures (down, timeout, rejected key) all mean the same to the searcher. */
  private async request(body: Record<string, unknown>): Promise<SearchResponse> {
    try {
      await this.setup.ensure();
      return await meilisearchRequest<SearchResponse>(
        this.config,
        "recherche",
        "POST",
        `/indexes/${MESSAGES_INDEX}/search`,
        body,
      );
    } catch (error) {
      console.error("[search] recherche Meilisearch impossible :", error);
      throw new MessageSearchUnavailableError();
    }
  }
}
