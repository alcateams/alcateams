import { Prisma } from "../../../generated/prisma/client";
import { database } from "../../../lib/database";
import type { Community } from "../domain/community.entity";
import {
  AlreadyMemberError,
  CommunityNameAlreadyTakenError,
  CommunityNotFoundError,
} from "../domain/community.errors";
import { toEntity, toPersistence } from "./community.mapper";
import type { CommunityRepositoryPort } from "./community.repository.port";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";
const FOREIGN_KEY_VIOLATION = "P2003";

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

  async findById(id: string): Promise<Community | null> {
    const record = await database.community.findUnique({
      where: { id },
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

  async search(term: string): Promise<Community[]> {
    const records = await database.community.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
      include: { subGroups: true },
      orderBy: { name: "asc" },
      take: 20,
    });
    return records.map(toEntity);
  }

  async addMember(communityId: string, userId: string): Promise<void> {
    try {
      await database.communityMember.create({
        data: { communityId, userId, role: "MEMBER" },
      });
    } catch (error) {
      throw this.translatePersistenceError(error);
    }
  }

  /**
   * Translates a unique-constraint violation into the matching domain error, closing the race
   * window left open by the pre-checks in the use cases: the database constraint is the source
   * of truth, so the loser of the race gets a meaningful 409.
   */
  private translatePersistenceError(error: unknown): unknown {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return error;

    // The community was deleted between the existence check and the membership insert.
    if (error.code === FOREIGN_KEY_VIOLATION) return new CommunityNotFoundError();

    if (error.code === UNIQUE_CONSTRAINT_VIOLATION) {
      // Depending on the driver, `target` is either the list of columns or the constraint name
      // (e.g. `CommunityMember_pkey`), so normalise both shapes into one string to match on.
      const target = error.meta?.target;
      const fields = Array.isArray(target) ? target.join(",") : String(target ?? "");
      if (fields.includes("name")) return new CommunityNameAlreadyTakenError();
      // The composite primary key of `CommunityMember` collides when the user is already a member.
      if (
        fields.includes("communityId") ||
        fields.includes("userId") ||
        fields.includes("CommunityMember")
      ) {
        return new AlreadyMemberError();
      }
    }
    return error;
  }
}
