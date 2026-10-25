import { describe, expect, it, vi } from "vitest";
import type { Community } from "../../domain/community.entity";
import { CommunityNotFoundError, NotCommunityModeratorError } from "../../domain/community.errors";
import type { CommunityMemberDetails, CommunityRole } from "../../domain/community.types";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import { ListMembersUseCase } from "./list-members.use-case";

const COMMUNITY_ID = "community-1";
const CALLER_ID = "caller-1";

const members: CommunityMemberDetails[] = [
  {
    userId: CALLER_ID,
    email: "mod@example.com",
    pseudo: "mod",
    role: "MODERATOR",
    joinedAt: new Date("2026-01-01"),
  },
];

const makeRepository = (options: {
  communityExists?: boolean;
  callerRole?: CommunityRole | null;
}) =>
  ({
    save: vi.fn(),
    findByName: vi.fn(),
    findById: vi.fn(async () =>
      options.communityExists === false ? null : ({ id: COMMUNITY_ID } as Community),
    ),
    listForUser: vi.fn(async () => []),
    listForUserWithRole: vi.fn(async () => []),
    search: vi.fn(async () => []),
    addMember: vi.fn(),
    findMemberRole: vi.fn(async () => options.callerRole ?? null),
    listMemberIds: vi.fn(async () => []),
    listMembers: vi.fn(async () => members),
    countModerators: vi.fn(async () => 1),
    changeRoleAndNotify: vi.fn(),
    addSubGroup: vi.fn(),
  }) satisfies CommunityRepositoryPort;

const run = (repository: CommunityRepositoryPort) =>
  new ListMembersUseCase(repository).execute({ communityId: COMMUNITY_ID, callerId: CALLER_ID });

describe("ListMembersUseCase", () => {
  it("rejects when the community does not exist (404)", async () => {
    const repository = makeRepository({ communityExists: false, callerRole: "MODERATOR" });
    await expect(run(repository)).rejects.toBeInstanceOf(CommunityNotFoundError);
  });

  it("rejects a caller who is not a member (403)", async () => {
    const repository = makeRepository({ callerRole: null });
    await expect(run(repository)).rejects.toBeInstanceOf(NotCommunityModeratorError);
  });

  it("rejects a plain member (403)", async () => {
    const repository = makeRepository({ callerRole: "MEMBER" });
    await expect(run(repository)).rejects.toBeInstanceOf(NotCommunityModeratorError);
  });

  it("returns the member list for a moderator", async () => {
    const repository = makeRepository({ callerRole: "MODERATOR" });
    await expect(run(repository)).resolves.toEqual(members);
  });

  it("returns the member list for a co-moderator", async () => {
    const repository = makeRepository({ callerRole: "COMODERATOR" });
    await expect(run(repository)).resolves.toEqual(members);
  });
});
