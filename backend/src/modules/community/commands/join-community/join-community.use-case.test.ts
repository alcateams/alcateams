import { describe, expect, it, vi } from "vitest";
import {
  AlreadyMemberError,
  CommunityNotFoundError,
  PrivateCommunityError,
} from "../../domain/community.errors";
import { makeCommunity, makeCommunityRepository } from "../../testing/test-doubles";
import { JoinCommunityUseCase } from "./join-community.use-case";

const makeSync = () => ({ addMembers: vi.fn(async () => {}) });

describe("JoinCommunityUseCase", () => {
  it("adds the membership, then the user to every channel's bubble", async () => {
    const repository = makeCommunityRepository();
    repository.findById.mockResolvedValue(makeCommunity());
    const sync = makeSync();

    await new JoinCommunityUseCase(repository, sync).execute({
      communityId: "community-1",
      userId: "u1",
    });

    expect(repository.addMember).toHaveBeenCalledWith("community-1", "u1");
    expect(sync.addMembers).toHaveBeenCalledWith(["bubble-general", "bubble-sub-1"], ["u1"]);
  });

  it("rejects an unknown community", async () => {
    const sync = makeSync();

    await expect(
      new JoinCommunityUseCase(makeCommunityRepository(), sync).execute({
        communityId: "nope",
        userId: "u1",
      }),
    ).rejects.toThrow(CommunityNotFoundError);
    expect(sync.addMembers).not.toHaveBeenCalled();
  });

  it("does not allow users to join a private community directly", async () => {
    const repository = makeCommunityRepository();
    repository.findById.mockResolvedValue(makeCommunity({ isPrivate: true }));
    const sync = makeSync();

    await expect(
      new JoinCommunityUseCase(repository, sync).execute({
        communityId: "community-1",
        userId: "u1",
      }),
    ).rejects.toThrow(PrivateCommunityError);
    expect(repository.addMember).not.toHaveBeenCalled();
    expect(sync.addMembers).not.toHaveBeenCalled();
  });

  it("doesn't touch the bubbles when the user is already a member", async () => {
    const repository = makeCommunityRepository();
    repository.findById.mockResolvedValue(makeCommunity());
    repository.addMember.mockRejectedValue(new AlreadyMemberError());
    const sync = makeSync();

    await expect(
      new JoinCommunityUseCase(repository, sync).execute({
        communityId: "community-1",
        userId: "u1",
      }),
    ).rejects.toThrow(AlreadyMemberError);
    expect(sync.addMembers).not.toHaveBeenCalled();
  });
});
