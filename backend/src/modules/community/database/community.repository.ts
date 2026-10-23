import { Prisma } from "../../../generated/prisma/client";
import { database } from "../../../lib/database";
import type { Community } from "../domain/community.entity";
import {
  AlreadyMemberError,
  CommunityNameAlreadyTakenError,
  CommunityNotFoundError,
  NotMemberError,
} from "../domain/community.errors";
import type { CommunityRole } from "../domain/community.types";
import { toEntity, toPersistence } from "./community.mapper";
import type { CommunityRepositoryPort } from "./community.repository.port";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";
const FOREIGN_KEY_VIOLATION = "P2003";
const RECORD_NOT_FOUND = "P2025";
const COMMUNITY_NAME_CONSTRAINT = "Community_name_key";

export class CommunityRepository implements CommunityRepositoryPort {
  async save(community: Community, creatorId: string): Promise<Community> {
    try {
      // A single nested create is wrapped in an implicit transaction by Prisma, so the
      // community, its sub-groups and the creator's moderator membership are written atomically.
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

  async findMemberRole(communityId: string, userId: string): Promise<CommunityRole | null> {
    const membership = await database.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
      select: { role: true },
    });
    return membership?.role ?? null;
  }

  async countModerators(communityId: string): Promise<number> {
    return database.communityMember.count({ where: { communityId, role: "MODERATOR" } });
  }

  async removeMember(communityId: string, userId: string): Promise<void> {
    try {
      await database.communityMember.delete({
        where: { communityId_userId: { communityId, userId } },
      });
    } catch (error) {
      // The membership was already removed (e.g. the user left twice at the same time).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === RECORD_NOT_FOUND
      ) {
        throw new NotMemberError();
      }
      throw error;
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
      if (this.isCommunityNameViolation(error)) return new CommunityNameAlreadyTakenError();
      if (this.isMembershipViolation(error)) return new AlreadyMemberError();
    }
    return error;
  }

  /**
   * The composite primary key of `CommunityMember` collides when the user is already a member.
   * Depending on the driver, `target` is either the constraint name (`CommunityMember_pkey`) or
   * the list of columns, so match on the model for the latter: `SubGroup (communityId, name)`
   * also involves `communityId`.
   */
  private isMembershipViolation(error: Prisma.PrismaClientKnownRequestError): boolean {
    const target = error.meta?.target;
    if (typeof target === "string") return target.startsWith("CommunityMember");
    return error.meta?.modelName === "CommunityMember";
  }

  /**
   * The `SubGroup (communityId, name)` constraint also involves a `name` column, so only match
   * the community's own constraint (by name, or by model + field for driver adapters that
   * report the target as columns).
   */
  private isCommunityNameViolation(error: Prisma.PrismaClientKnownRequestError): boolean {
    const target = error.meta?.target;
    if (target === COMMUNITY_NAME_CONSTRAINT) return true;
    if (Array.isArray(target)) {
      return error.meta?.modelName === "Community" && target.length === 1 && target[0] === "name";
    }
    return false;
  }
}
