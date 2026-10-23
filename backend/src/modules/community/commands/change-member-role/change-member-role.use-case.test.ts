import { describe, expect, it, vi } from "vitest";
import type { Community } from "../../domain/community.entity";
import {
  CannotEditOwnRoleError,
  CommunityNotFoundError,
  LastModeratorError,
  MemberNotFoundError,
  NotCommunityModeratorError,
} from "../../domain/community.errors";
import type { CommunityRole } from "../../domain/community.types";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import { ChangeMemberRoleUseCase } from "./change-member-role.use-case";

const COMMUNITY_ID = "community-1";
const MODERATOR_ID = "mod-1";
const TARGET_ID = "member-1";

/**
 * Builds a repository stub. `roles` maps a userId to the role it holds in the community; a user
 * absent from the map is treated as a non-member. `moderatorCount` drives the last-moderator rule.
 */
const makeRepository = (options: {
  communityExists?: boolean;
  roles?: Record<string, CommunityRole>;
  moderatorCount?: number;
}) => {
  const roles = options.roles ?? {};
  return {
    save: vi.fn(),
    findByName: vi.fn(),
    findById: vi.fn(async () =>
      options.communityExists === false ? null : ({ id: COMMUNITY_ID } as Community),
    ),
    listForUser: vi.fn(async () => []),
    listForUserWithRole: vi.fn(async () => []),
    search: vi.fn(async () => []),
    addMember: vi.fn(),
    findMemberRole: vi.fn(async (_communityId: string, userId: string) => roles[userId] ?? null),
    listMemberIds: vi.fn(async () => []),
    listMembers: vi.fn(async () => []),
    countModerators: vi.fn(async () => options.moderatorCount ?? 1),
    changeRoleAndNotify: vi.fn(async () => {}),
    addSubGroup: vi.fn(),
  } satisfies CommunityRepositoryPort;
};

const run = (repository: CommunityRepositoryPort, newRole: CommunityRole, targetId = TARGET_ID) =>
  new ChangeMemberRoleUseCase(repository).execute({
    communityId: COMMUNITY_ID,
    callerId: MODERATOR_ID,
    targetUserId: targetId,
    newRole,
  });

describe("ChangeMemberRoleUseCase", () => {
  it("rejects when the community does not exist (404)", async () => {
    const repository = makeRepository({ communityExists: false });
    await expect(run(repository, "COMODERATOR")).rejects.toBeInstanceOf(CommunityNotFoundError);
  });

  it("rejects a caller who is not a moderator of the community (403)", async () => {
    const repository = makeRepository({
      roles: { [MODERATOR_ID]: "MEMBER", [TARGET_ID]: "MEMBER" },
    });
    await expect(run(repository, "COMODERATOR")).rejects.toBeInstanceOf(NotCommunityModeratorError);
  });

  it("rejects a co-moderator trying to assign a role (403)", async () => {
    const repository = makeRepository({
      roles: { [MODERATOR_ID]: "COMODERATOR", [TARGET_ID]: "MEMBER" },
    });
    await expect(run(repository, "COMODERATOR")).rejects.toBeInstanceOf(NotCommunityModeratorError);
  });

  it("rejects a moderator editing their own role (403)", async () => {
    const repository = makeRepository({ roles: { [MODERATOR_ID]: "MODERATOR" } });
    await expect(run(repository, "MEMBER", MODERATOR_ID)).rejects.toBeInstanceOf(
      CannotEditOwnRoleError,
    );
  });

  it("rejects when the target is not a member of the community (404)", async () => {
    const repository = makeRepository({ roles: { [MODERATOR_ID]: "MODERATOR" } });
    await expect(run(repository, "COMODERATOR")).rejects.toBeInstanceOf(MemberNotFoundError);
  });

  it("rejects demoting the last moderator (409)", async () => {
    const repository = makeRepository({
      roles: { [MODERATOR_ID]: "MODERATOR", [TARGET_ID]: "MODERATOR" },
      moderatorCount: 1,
    });
    await expect(run(repository, "MEMBER")).rejects.toBeInstanceOf(LastModeratorError);
    expect(repository.changeRoleAndNotify).not.toHaveBeenCalled();
  });

  it("allows demoting a moderator when another moderator remains", async () => {
    const repository = makeRepository({
      roles: { [MODERATOR_ID]: "MODERATOR", [TARGET_ID]: "MODERATOR" },
      moderatorCount: 2,
    });
    await expect(run(repository, "MEMBER")).resolves.toEqual({ userId: TARGET_ID, role: "MEMBER" });
    expect(repository.changeRoleAndNotify).toHaveBeenCalledWith(COMMUNITY_ID, TARGET_ID, "MEMBER");
  });

  it("assigns a new role and triggers the notification", async () => {
    const repository = makeRepository({
      roles: { [MODERATOR_ID]: "MODERATOR", [TARGET_ID]: "MEMBER" },
    });
    await expect(run(repository, "COMODERATOR")).resolves.toEqual({
      userId: TARGET_ID,
      role: "COMODERATOR",
    });
    expect(repository.changeRoleAndNotify).toHaveBeenCalledWith(
      COMMUNITY_ID,
      TARGET_ID,
      "COMODERATOR",
    );
  });
});
