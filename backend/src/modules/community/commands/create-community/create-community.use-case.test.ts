import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Community } from "../../domain/community.entity";
import { CommunityNameAlreadyTakenError } from "../../domain/community.errors";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import type { CommunityProviderPort } from "../../provider/community-provider.port";
import { BubbleCreationFailedError } from "../../provider/community-provider.errors";
import { CreateCommunityUseCase } from "./create-community.use-case";

const input = {
  name: "Chess club",
  description: "All about chess",
  subGroups: [
    { name: "Openings", theme: "Theory" },
    { name: "Endgames", theme: "Practice" },
  ],
  creatorId: "user-1",
  creatorToken: "token",
};

const makeProvider = () => {
  let counter = 0;
  return {
    createBubble: vi.fn(async () => `bubble-${++counter}`),
    deleteBubble: vi.fn(async () => {}),
  } satisfies CommunityProviderPort;
};

const makeRepository = () =>
  ({
    save: vi.fn(async (community: Community) => community),
    findByName: vi.fn<CommunityRepositoryPort["findByName"]>(async () => null),
    findById: vi.fn(async () => null),
    listForUser: vi.fn(async () => []),
    listForUserWithRole: vi.fn(async () => []),
    search: vi.fn(async () => []),
    addMember: vi.fn(async () => {}),
    findMemberRole: vi.fn(async () => null),
    listMembers: vi.fn(async () => []),
    countModerators: vi.fn(async () => 0),
    changeRoleAndNotify: vi.fn(async () => {}),
  }) satisfies CommunityRepositoryPort;

describe("CreateCommunityUseCase", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("creates one bubble per sub-group and persists the community", async () => {
    const provider = makeProvider();
    const repository = makeRepository();

    const community = await new CreateCommunityUseCase(repository, provider).execute(input);

    expect(provider.createBubble).toHaveBeenCalledTimes(2);
    expect(repository.save).toHaveBeenCalledWith(community, "user-1");
    expect(community.subGroups.map((s) => s.rainbowBubbleId)).toEqual(["bubble-1", "bubble-2"]);
  });

  it("rejects an already taken name before touching the provider", async () => {
    const provider = makeProvider();
    const repository = makeRepository();
    repository.findByName.mockResolvedValue({} as Community);

    await expect(new CreateCommunityUseCase(repository, provider).execute(input)).rejects.toThrow(
      CommunityNameAlreadyTakenError,
    );
    expect(provider.createBubble).not.toHaveBeenCalled();
  });

  it("rolls back created bubbles when bubble N fails", async () => {
    const provider = makeProvider();
    provider.createBubble
      .mockResolvedValueOnce("bubble-1")
      .mockRejectedValueOnce(new BubbleCreationFailedError("boom"));
    const repository = makeRepository();

    await expect(new CreateCommunityUseCase(repository, provider).execute(input)).rejects.toThrow(
      BubbleCreationFailedError,
    );
    expect(provider.deleteBubble).toHaveBeenCalledTimes(1);
    expect(provider.deleteBubble).toHaveBeenCalledWith("token", "bubble-1");
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("rolls back all bubbles when save fails and surfaces the save error", async () => {
    const provider = makeProvider();
    const repository = makeRepository();
    const saveError = new Error("db down");
    repository.save.mockRejectedValue(saveError);

    await expect(new CreateCommunityUseCase(repository, provider).execute(input)).rejects.toBe(
      saveError,
    );
    expect(provider.deleteBubble).toHaveBeenCalledTimes(2);
  });

  it("logs orphaned bubbles and still surfaces the original error when delete fails", async () => {
    const provider = makeProvider();
    provider.deleteBubble.mockRejectedValue(new Error("delete failed"));
    const repository = makeRepository();
    const saveError = new Error("db down");
    repository.save.mockRejectedValue(saveError);

    await expect(new CreateCommunityUseCase(repository, provider).execute(input)).rejects.toBe(
      saveError,
    );
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("bubble-1"),
      expect.any(Error),
    );
  });

  it("logs the created bubble ids before persisting", async () => {
    await new CreateCommunityUseCase(makeRepository(), makeProvider()).execute(input);

    expect(console.info).toHaveBeenCalledWith(expect.any(String), ["bubble-1", "bubble-2"]);
  });
});
