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
  isPrivate: boolean
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
