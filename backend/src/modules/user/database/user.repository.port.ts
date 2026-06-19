import type { User } from "../domain/user.entity";

export interface UserRepositoryPort {
  saveUser(user: User): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
