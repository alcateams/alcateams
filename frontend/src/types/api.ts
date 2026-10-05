export type User = {
  id: string
  email: string
  pseudo: string
  bio: string | null
}

export type AuthResponse = {
  token: string
  user: User
}
