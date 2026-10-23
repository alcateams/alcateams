import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CommunityNotFoundError,
  GeneralChannelAlreadyExistsError,
  NotCommunityMemberError,
} from "../../domain/community.errors";
import {
  ADMIN,
  makeAdminSession,
  makeCommunity,
  makeCommunityProvider,
  makeCommunityRepository,
} from "../../testing/test-doubles";
import { GetCommunityUseCase } from "./get-community.use-case";

const input = { communityId: "community-1", userId: "u1" };

const setup = (community = makeCommunity()) => {
  const repository = makeCommunityRepository();
  repository.findById.mockResolvedValue(community);
  const provider = makeCommunityProvider();
  const sync = { addMembers: vi.fn(async () => {}) };
  const useCase = new GetCommunityUseCase(repository, provider, makeAdminSession(), sync);
  return { repository, provider, sync, useCase };
};

describe("GetCommunityUseCase", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("returns the community and the caller's role", async () => {
    const { repository, provider, useCase } = setup();
    repository.findMemberRole.mockResolvedValue("MODERATOR");

    const { community, role } = await useCase.execute(input);

    expect(community.id).toBe("community-1");
    expect(role).toBe("MODERATOR");
    expect(provider.createBubble).not.toHaveBeenCalled();
  });

  it("rejects an unknown community", async () => {
    const { repository, useCase } = setup();
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(CommunityNotFoundError);
  });

  it("rejects non-members", async () => {
    const { repository, useCase } = setup();
    repository.findMemberRole.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotCommunityMemberError);
  });

  it("creates a missing general channel as the admin and adds every member to it", async () => {
    const { repository, provider, sync, useCase } = setup(makeCommunity({ withGeneral: false }));
    repository.addSubGroup.mockResolvedValue(makeCommunity());
    repository.listMemberIds.mockResolvedValue(["u1", "u2"]);

    const { community } = await useCase.execute(input);

    expect(provider.createBubble).toHaveBeenCalledWith(ADMIN.token, expect.any(Object));
    expect(repository.addSubGroup).toHaveBeenCalledWith(
      "community-1",
      expect.objectContaining({ kind: "GENERAL", rainbowBubbleId: "bubble-1" }),
    );
    expect(sync.addMembers).toHaveBeenCalledWith(["bubble-1"], ["u1", "u2"]);
    expect(community.generalChannel).toBeDefined();
  });

  it("uses the concurrently created channel and deletes its own bubble when it loses the race", async () => {
    const { repository, provider, sync, useCase } = setup(makeCommunity({ withGeneral: false }));
    repository.addSubGroup.mockRejectedValue(new GeneralChannelAlreadyExistsError());
    repository.findById
      .mockResolvedValueOnce(makeCommunity({ withGeneral: false }))
      .mockResolvedValueOnce(makeCommunity());

    const { community } = await useCase.execute(input);

    expect(provider.deleteBubble).toHaveBeenCalledWith(ADMIN.token, "bubble-1");
    expect(sync.addMembers).not.toHaveBeenCalled();
    expect(community.generalChannel?.id).toBe("general");
  });

  it("deletes the bubble and still opens the community when persistence fails", async () => {
    const { repository, provider, useCase } = setup(makeCommunity({ withGeneral: false }));
    repository.addSubGroup.mockRejectedValue(new Error("db down"));

    const { community } = await useCase.execute(input);

    expect(community.generalChannel).toBeUndefined();
    expect(provider.deleteBubble).toHaveBeenCalledWith(ADMIN.token, "bubble-1");
  });

  it("still opens the community when Rainbow is down", async () => {
    const { provider, useCase } = setup(makeCommunity({ withGeneral: false }));
    provider.createBubble.mockRejectedValue(new Error("rainbow down"));

    const { community } = await useCase.execute(input);

    expect(community.id).toBe("community-1");
  });
});
