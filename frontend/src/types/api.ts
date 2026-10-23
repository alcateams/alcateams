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

export type CommunityRole = 'MODERATOR' | 'COMODERATOR' | 'MEMBER'

export type Community = {
  id: string
  name: string
  description: string
  subGroups: SubGroup[]
  // Role the current user holds in this community, returned by `GET /communities/me`.
  myRole: CommunityRole
}

export type CommunityMember = {
  userId: string
  email: string
  pseudo: string
  role: CommunityRole
  joinedAt: string
}

export type Notification = {
  id: string
  type: 'ROLE_CHANGED'
  communityId: string
  communityName: string
  role: CommunityRole
  read: boolean
  createdAt: string
}

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
