import { describe, expect, it, vi } from "vitest";
import {
  CommunityNotFoundError,
  LastModeratorError,
  NotCommunityMemberError,
} from "../../domain/community.errors";
import { makeCommunity, makeCommunityRepository } from "../../testing/test-doubles";
import { LeaveCommunityUseCase } from "./leave-community.use-case";

const input = { communityId: "community-1", userId: "u1" };

const makeSync = () => ({ removeMembers: vi.fn(async () => {}) });

const makeMemberRepository = () => {
  const repository = makeCommunityRepository();
  repository.findById.mockResolvedValue(makeCommunity());
  return repository;
};

describe("LeaveCommunityUseCase", () => {
  it("removes the membership, then the user from every channel's bubble", async () => {
    const repository = makeMemberRepository();
    const sync = makeSync();

    await new LeaveCommunityUseCase(repository, sync).execute(input);

    expect(repository.removeMember).toHaveBeenCalledWith("community-1", "u1");
    expect(sync.removeMembers).toHaveBeenCalledWith(["bubble-general", "bubble-sub-1"], ["u1"]);
  });

  it("rejects an unknown community", async () => {
    const repository = makeCommunityRepository();
    const sync = makeSync();

    await expect(new LeaveCommunityUseCase(repository, sync).execute(input)).rejects.toThrow(
      CommunityNotFoundError,
    );
    expect(repository.removeMember).not.toHaveBeenCalled();
    expect(sync.removeMembers).not.toHaveBeenCalled();
  });

  it("rejects a user who is not a member", async () => {
    const repository = makeMemberRepository();
    repository.findMemberRole.mockResolvedValue(null);
    const sync = makeSync();

    await expect(new LeaveCommunityUseCase(repository, sync).execute(input)).rejects.toThrow(
      NotCommunityMemberError,
    );
    expect(repository.removeMember).not.toHaveBeenCalled();
    expect(sync.removeMembers).not.toHaveBeenCalled();
  });

  it("prevents the last moderator from leaving", async () => {
    const repository = makeMemberRepository();
    repository.findMemberRole.mockResolvedValue("MODERATOR");
    repository.countModerators.mockResolvedValue(1);
    const sync = makeSync();

    await expect(new LeaveCommunityUseCase(repository, sync).execute(input)).rejects.toThrow(
      LastModeratorError,
    );
    expect(repository.removeMember).not.toHaveBeenCalled();
    expect(sync.removeMembers).not.toHaveBeenCalled();
  });

  it("lets a moderator leave when another moderator remains", async () => {
    const repository = makeMemberRepository();
    repository.findMemberRole.mockResolvedValue("MODERATOR");
    repository.countModerators.mockResolvedValue(2);

    await new LeaveCommunityUseCase(repository, makeSync()).execute(input);

    expect(repository.removeMember).toHaveBeenCalledWith("community-1", "u1");
  });

  it("doesn't touch the bubbles when the membership was already removed", async () => {
    const repository = makeMemberRepository();
    repository.removeMember.mockRejectedValue(new NotCommunityMemberError());
    const sync = makeSync();

    await expect(new LeaveCommunityUseCase(repository, sync).execute(input)).rejects.toThrow(
      NotCommunityMemberError,
    );
    expect(sync.removeMembers).not.toHaveBeenCalled();
  });
});
