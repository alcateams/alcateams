import type { User } from "./domain/user.entity";

export interface UserResponse {
  id: string;
  email: string;
  pseudo: string;
}

/** Maps a domain user to the shape exposed over the HTTP API (no internal fields leaked). */
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    pseudo: user.pseudo,
  };
}
