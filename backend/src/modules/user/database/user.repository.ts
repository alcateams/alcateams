import { database } from "../../../lib/database";
import type { User } from "../domain/user.entity";
import { toEntity, toPersistence } from "../domain/user.mapper";
import type { UserRepositoryPort } from "./user.repository.port";

export class UserRepository implements UserRepositoryPort {
  async saveUser(user: User): Promise<User> {
    const record = await database.user.create({ data: toPersistence(user) });
    return toEntity(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await database.user.findUnique({ where: { email } });
    return record ? toEntity(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await database.user.findUnique({ where: { id } });
    return record ? toEntity(record) : null;
  }
}
