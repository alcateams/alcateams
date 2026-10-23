import { Prisma } from "../../../generated/prisma/client";
import { database } from "../../../lib/database";
import type { Community } from "../domain/community.entity";
import {
  AlreadyMemberError,
  CommunityNameAlreadyTakenError,
  CommunityNotFoundError,
  GeneralChannelAlreadyExistsError,
} from "../domain/community.errors";
import type { CommunityRole, CreateSubGroupProps } from "../domain/community.types";
import { toEntity, toPersistence } from "./community.mapper";
import type { CommunityRepositoryPort } from "./community.repository.port";

const UNIQUE_CONSTRAINT_VIOLATION = "P2002";
const FOREIGN_KEY_VIOLATION = "P2003";
const COMMUNITY_NAME_CONSTRAINT = "Community_name_key";

// The general channel first (enum declaration order), then sub-groups in creation order.
const INCLUDE_SUB_GROUPS = {
  subGroups: { orderBy: [{ kind: "asc" }, { createdAt: "asc" }] },
} satisfies Prisma.CommunityInclude;

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
        include: INCLUDE_SUB_GROUPS,
      });
      return toEntity(record);
    } catch (error) {
      throw this.translatePersistenceError(error);
    }
  }

  async findByName(name: string): Promise<Community | null> {
    const record = await database.community.findUnique({
      where: { name },
      include: INCLUDE_SUB_GROUPS,
    });
    return record ? toEntity(record) : null;
  }

  async findById(id: string): Promise<Community | null> {
    const record = await database.community.findUnique({
      where: { id },
      include: INCLUDE_SUB_GROUPS,
    });
    return record ? toEntity(record) : null;
  }

  async listForUser(userId: string): Promise<Community[]> {
    const records = await database.community.findMany({
      where: { members: { some: { userId } } },
      include: INCLUDE_SUB_GROUPS,
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
      include: INCLUDE_SUB_GROUPS,
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

  async listMemberIds(communityId: string): Promise<string[]> {
    const members = await database.communityMember.findMany({
      where: { communityId },
      select: { userId: true },
    });
    return members.map((member) => member.userId);
  }

  async addSubGroup(communityId: string, subGroup: CreateSubGroupProps): Promise<Community> {
    try {
      const record = await database.community.update({
        where: { id: communityId },
        data: { subGroups: { create: subGroup } },
        include: INCLUDE_SUB_GROUPS,
      });
      return toEntity(record);
    } catch (error) {
      // The general channel's name is reserved, so a `(communityId, name)` collision on it means
      // another request created it first.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION &&
        subGroup.kind === "GENERAL"
      ) {
        throw new GeneralChannelAlreadyExistsError();
      }
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
