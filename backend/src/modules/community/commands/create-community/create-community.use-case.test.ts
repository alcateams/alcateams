import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Community } from "../../domain/community.entity";
import { CommunityNameAlreadyTakenError } from "../../domain/community.errors";
import {
  BubbleCreationFailedError,
  BubbleMemberAdditionFailedError,
} from "../../provider/community-provider.errors";
import {
  ADMIN,
  makeAdminSession,
  makeCommunityProvider as makeProvider,
  makeCommunityRepository as makeRepository,
} from "../../testing/test-doubles";
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

describe("CreateCommunityUseCase", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("creates the general channel and one bubble per sub-group, then persists", async () => {
    const provider = makeProvider();
    const repository = makeRepository();

    const community = await new CreateCommunityUseCase(
      repository,
      provider,
      makeAdminSession(),
    ).execute(input);

    expect(provider.createBubble).toHaveBeenCalledTimes(3);
    expect(repository.save).toHaveBeenCalledWith(community, "user-1");
    expect(community.subGroups.map((s) => [s.name, s.kind, s.rainbowBubbleId])).toEqual([
      ["Général", "GENERAL", "bubble-1"],
      ["Openings", "THEMATIC", "bubble-2"],
      ["Endgames", "THEMATIC", "bubble-3"],
    ]);
  });

  it("makes the admin a moderator of every bubble, with the creator's token", async () => {
    const provider = makeProvider();

    await new CreateCommunityUseCase(makeRepository(), provider, makeAdminSession()).execute(input);

    expect(provider.addMember.mock.calls).toEqual(
      ["bubble-1", "bubble-2", "bubble-3"].map((bubbleId) => [
        "token",
        bubbleId,
        ADMIN.userId,
        "moderator",
      ]),
    );
  });

  it("rolls back the bubbles when the admin can't be made moderator", async () => {
    const provider = makeProvider();
    provider.addMember
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new BubbleMemberAdditionFailedError("boom"));
    const repository = makeRepository();

    await expect(
      new CreateCommunityUseCase(repository, provider, makeAdminSession()).execute(input),
    ).rejects.toThrow(BubbleMemberAdditionFailedError);
    expect(provider.deleteBubble.mock.calls.map(([, bubbleId]) => bubbleId)).toEqual([
      "bubble-1",
      "bubble-2",
    ]);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("rejects an already taken name before touching the provider", async () => {
    const provider = makeProvider();
    const repository = makeRepository();
    repository.findByName.mockResolvedValue({} as Community);

    await expect(
      new CreateCommunityUseCase(repository, provider, makeAdminSession()).execute(input),
    ).rejects.toThrow(CommunityNameAlreadyTakenError);
    expect(provider.createBubble).not.toHaveBeenCalled();
  });

  it("rolls back created bubbles when bubble N fails", async () => {
    const provider = makeProvider();
    provider.createBubble
      .mockResolvedValueOnce("bubble-1")
      .mockRejectedValueOnce(new BubbleCreationFailedError("boom"));
    const repository = makeRepository();

    await expect(
      new CreateCommunityUseCase(repository, provider, makeAdminSession()).execute(input),
    ).rejects.toThrow(BubbleCreationFailedError);
    expect(provider.deleteBubble).toHaveBeenCalledTimes(1);
    expect(provider.deleteBubble).toHaveBeenCalledWith("token", "bubble-1");
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("rolls back all bubbles when save fails and surfaces the save error", async () => {
    const provider = makeProvider();
    const repository = makeRepository();
    const saveError = new Error("db down");
    repository.save.mockRejectedValue(saveError);

    await expect(
      new CreateCommunityUseCase(repository, provider, makeAdminSession()).execute(input),
    ).rejects.toBe(saveError);
    expect(provider.deleteBubble).toHaveBeenCalledTimes(3);
  });

  it("logs orphaned bubbles and still surfaces the original error when delete fails", async () => {
    const provider = makeProvider();
    provider.deleteBubble.mockRejectedValue(new Error("delete failed"));
    const repository = makeRepository();
    const saveError = new Error("db down");
    repository.save.mockRejectedValue(saveError);

    await expect(
      new CreateCommunityUseCase(repository, provider, makeAdminSession()).execute(input),
    ).rejects.toBe(saveError);
    expect(console.error).toHaveBeenCalledTimes(3);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("bubble-1"),
      expect.any(Error),
    );
  });

  it("logs the created bubble ids before persisting", async () => {
    await new CreateCommunityUseCase(makeRepository(), makeProvider(), makeAdminSession()).execute(
      input,
    );

    expect(console.info).toHaveBeenCalledWith(expect.any(String), [
      "bubble-1",
      "bubble-2",
      "bubble-3",
    ]);
  });
});
