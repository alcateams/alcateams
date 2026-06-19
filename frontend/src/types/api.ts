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

export type Theme = {
  id: string
  name: string
}

export type Community = {
  id: string
  name: string
  description: string
  themes: Theme[]
}
