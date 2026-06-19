import { Prisma } from "../../../generated/prisma/client";
import { database } from "../../../lib/database";
import type { Community } from "../domain/community.entity";
import { CommunityNameAlreadyTakenError } from "../domain/community.errors";
import { toEntity, toPersistence } from "./community.mapper";
import type { CommunityRepositoryPort } from "./community.repository.port";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

export class CommunityRepository implements CommunityRepositoryPort {
  async save(community: Community, creatorId: string): Promise<Community> {
    try {
      // A single nested create is wrapped in an implicit transaction by Prisma, so the
      // community, its themes and the creator's moderator membership are written atomically.
      const record = await database.community.create({
        data: {
          ...toPersistence(community),
          members: { create: { userId: creatorId, role: "MODERATOR" } },
        },
        include: { subGroups: true },
      });
      return toEntity(record);
    } catch (error) {
      throw this.translatePersistenceError(error);
    }
  }

  async findByName(name: string): Promise<Community | null> {
    const record = await database.community.findUnique({
      where: { name },
      include: { subGroups: true },
    });
    return record ? toEntity(record) : null;
  }

  async listForUser(userId: string): Promise<Community[]> {
    const records = await database.community.findMany({
      where: { members: { some: { userId } } },
      include: { subGroups: true },
      orderBy: { createdAt: "desc" },
    });
    return records.map(toEntity);
  }

  /**
   * Translates a unique-constraint violation on the community name into the matching domain
   * error, closing the race window left open by the pre-check in the use case: the database
   * constraint is the source of truth, so the loser of the race gets a meaningful 409.
   */
  private translatePersistenceError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_CONSTRAINT_VIOLATION
    ) {
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target : [target];
      if (fields.includes("name")) return new CommunityNameAlreadyTakenError();
    }
    return error;
  }
}
