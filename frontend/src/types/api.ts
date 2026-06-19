export type User = {
  id: string
  email: string
  pseudo: string
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

export type Community = {
  id: string
  name: string
  description: string
  subGroups: SubGroup[]
}
