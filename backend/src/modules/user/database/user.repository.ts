import { Prisma } from "../../../generated/prisma/client";
import { database } from "../../../lib/database";
import type { User } from "../domain/user.entity";
import { PseudoAlreadyTakenError, UserAlreadyExistsError } from "../domain/user.errors";
import { toEntity, toPersistence } from "./user.mapper";
import type { UserRepositoryPort } from "./user.repository.port";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

export class UserRepository implements UserRepositoryPort {
  async saveUser(user: User): Promise<User> {
    try {
      const record = await database.user.create({ data: toPersistence(user) });
      return toEntity(record);
    } catch (error) {
      throw this.translatePersistenceError(error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await database.user.findUnique({ where: { email } });
    return record ? toEntity(record) : null;
  }

  async findByPseudo(pseudo: string): Promise<User | null> {
    const record = await database.user.findUnique({ where: { pseudo } });
    return record ? toEntity(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await database.user.findUnique({ where: { id } });
    return record ? toEntity(record) : null;
  }

  /**
   * Translates a unique-constraint violation into the matching domain error.
   * This closes the race window where two concurrent registrations both pass the
   * pre-checks: the database constraint is the source of truth, and the loser of
   * the race gets a meaningful 409 instead of an opaque 500.
   */
  private translatePersistenceError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_CONSTRAINT_VIOLATION
    ) {
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target : [target];
      if (fields.includes("pseudo")) return new PseudoAlreadyTakenError();
      if (fields.includes("email")) return new UserAlreadyExistsError();
    }
    return error;
  }
}
