import { describe, expect, it, vi } from "vitest";
import type { Community } from "../../domain/community.entity";
import {
  CommunityNotFoundError,
  LastModeratorError,
  NotMemberError,
} from "../../domain/community.errors";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import { LeaveCommunityUseCase } from "./leave-community.use-case";

const input = { communityId: "community-1", userId: "user-1" };

const makeRepository = () =>
  ({
    save: vi.fn(async (community: Community) => community),
    findByName: vi.fn(async () => null),
    findById: vi.fn<CommunityRepositoryPort["findById"]>(async () => ({}) as Community),
    listForUser: vi.fn(async () => []),
    search: vi.fn(async () => []),
    addMember: vi.fn(async () => {}),
    findMemberRole: vi.fn<CommunityRepositoryPort["findMemberRole"]>(async () => "MEMBER"),
    countModerators: vi.fn(async () => 1),
    removeMember: vi.fn(async () => {}),
  }) satisfies CommunityRepositoryPort;

describe("LeaveCommunityUseCase", () => {
  it("removes a member from the community", async () => {
    const repository = makeRepository();

    await new LeaveCommunityUseCase(repository).execute(input);

    expect(repository.removeMember).toHaveBeenCalledWith("community-1", "user-1");
  });

  it("rejects an unknown community", async () => {
    const repository = makeRepository();
    repository.findById.mockResolvedValue(null);

    await expect(new LeaveCommunityUseCase(repository).execute(input)).rejects.toThrow(
      CommunityNotFoundError,
    );
    expect(repository.removeMember).not.toHaveBeenCalled();
  });

  it("rejects a user who is not a member", async () => {
    const repository = makeRepository();
    repository.findMemberRole.mockResolvedValue(null);

    await expect(new LeaveCommunityUseCase(repository).execute(input)).rejects.toThrow(
      NotMemberError,
    );
    expect(repository.removeMember).not.toHaveBeenCalled();
  });

  it("prevents the last moderator from leaving", async () => {
    const repository = makeRepository();
    repository.findMemberRole.mockResolvedValue("MODERATOR");
    repository.countModerators.mockResolvedValue(1);

    await expect(new LeaveCommunityUseCase(repository).execute(input)).rejects.toThrow(
      LastModeratorError,
    );
    expect(repository.removeMember).not.toHaveBeenCalled();
  });

  it("lets a moderator leave when another moderator remains", async () => {
    const repository = makeRepository();
    repository.findMemberRole.mockResolvedValue("MODERATOR");
    repository.countModerators.mockResolvedValue(2);

    await new LeaveCommunityUseCase(repository).execute(input);

    expect(repository.removeMember).toHaveBeenCalledWith("community-1", "user-1");
  });
});
