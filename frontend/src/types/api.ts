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

export type SubGroup = {
  id: string
  name: string
  theme: string
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
