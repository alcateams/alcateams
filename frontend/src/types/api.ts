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
