export type User = {
  id: string
  email: string
  pseudo: string
}

export type AuthResponse = {
  token: string
  user: User
}
