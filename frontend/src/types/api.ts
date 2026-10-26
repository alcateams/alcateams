export type User = {
  id: string
  email: string
  pseudo: string
  bio: string | null
  urls: string[]
}

export type AuthResponse = {
  token: string
  user: User
}

/** `GENERAL` is the community-wide channel, `THEMATIC` a regular sub-group. */
export type SubGroupKind = 'GENERAL' | 'THEMATIC'

export type SubGroup = {
  id: string
  name: string
  theme: string
  kind: SubGroupKind
}

export type Community = {
  id: string
  name: string
  description: string
  subGroups: SubGroup[]
}

export type CommunityRole = 'MODERATOR' | 'MEMBER'

export type CommunityDetails = Community & {
  /** The current user's role in the community. */
  role: CommunityRole
}

export type Message = {
  id: string
  text: string
  author: { id: string; pseudo: string }
  createdAt: string
}

export type MessagePage = {
  /** Newest first. */
  messages: Message[]
  /** Pass as `before` to load older messages, `null` once the history is exhausted. */
  nextCursor: string | null
}

export type MessageSearchSort = 'relevance' | 'recent'

/** A run of a search excerpt, highlighted when it matches the query. */
export type SnippetPart = { text: string; highlighted: boolean }

export type MessageSearchResult = {
  id: string
  snippet: SnippetPart[]
  author: { id: string; pseudo: string }
  community: { id: string; name: string }
  subGroup: { id: string; name: string }
  createdAt: string
}

export type MessageSearchPage = {
  results: MessageSearchResult[]
  /** Estimated by the search engine. */
  total: number
  /** Pass as `offset` to load more results, `null` on the last page. */
  nextOffset: number | null
}
