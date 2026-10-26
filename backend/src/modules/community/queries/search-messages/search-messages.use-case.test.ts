import { describe, expect, it } from "vitest";
import { NotCommunityMemberError, SubGroupNotFoundError } from "../../domain/community.errors";
import type { MessageSearchHit } from "../../provider/message-search.port";
import {
  makeCommunity,
  makeCommunityRepository,
  makeMessageSearch,
} from "../../testing/test-doubles";
import { SearchMessagesUseCase } from "./search-messages.use-case";

const input = { userId: "u1", q: "ouverture", sort: "relevance" as const, limit: 2, offset: 0 };

const hit = (overrides: Partial<MessageSearchHit> = {}): MessageSearchHit => ({
  id: "m1",
  communityId: "community-1",
  subGroupId: "sub-1",
  authorId: "u2",
  authorPseudo: "bob",
  createdAt: new Date("2026-10-23T10:00:00Z"),
  snippet: [{ text: "ouverture", highlighted: true }],
  ...overrides,
});

const setup = () => {
  const communities = makeCommunityRepository();
  const chess = makeCommunity();
  const go = makeCommunity({ id: "community-2", name: "Go club" });
  communities.listForUser.mockResolvedValue([chess, go]);
  communities.findById.mockResolvedValue(chess);
  const search = makeMessageSearch();
  return { communities, search, useCase: new SearchMessagesUseCase(communities, search) };
};

describe("SearchMessagesUseCase", () => {
  it("searches every community the user belongs to and names each result's place", async () => {
    const { search, useCase } = setup();
    search.search.mockResolvedValue({
      hits: [hit(), hit({ id: "m2", communityId: "community-2", subGroupId: "general" })],
      total: 5,
    });

    const page = await useCase.execute(input);

    expect(search.search).toHaveBeenCalledWith({
      query: "ouverture",
      communityIds: ["community-1", "community-2"],
      subGroupId: undefined,
      sort: "relevance",
      limit: 2,
      offset: 0,
    });
    expect(page.results.map((r) => [r.id, r.communityName, r.subGroupName])).toEqual([
      ["m1", "Chess club", "Openings"],
      ["m2", "Go club", "Général"],
    ]);
    expect(page.nextOffset).toBe(2);
  });

  it("drops hits whose community or channel is no longer accessible", async () => {
    const { search, useCase } = setup();
    search.search.mockResolvedValue({
      hits: [hit({ communityId: "left" }), hit({ id: "m2", subGroupId: "deleted" })],
      total: 2,
    });

    const page = await useCase.execute(input);

    expect(page.results).toEqual([]);
    expect(page.nextOffset).toBeNull();
  });

  it("narrows the search to one channel of a community the user belongs to", async () => {
    const { communities, search, useCase } = setup();

    await useCase.execute({ ...input, communityId: "community-1", subGroupId: "sub-1" });

    expect(communities.listForUser).not.toHaveBeenCalled();
    expect(search.search).toHaveBeenCalledWith(
      expect.objectContaining({ communityIds: ["community-1"], subGroupId: "sub-1" }),
    );
  });

  it("rejects a community the user is not a member of", async () => {
    const { communities, search, useCase } = setup();
    communities.findMemberRole.mockResolvedValue(null);

    await expect(useCase.execute({ ...input, communityId: "community-1" })).rejects.toThrow(
      NotCommunityMemberError,
    );
    expect(search.search).not.toHaveBeenCalled();
  });

  it("rejects a channel of another community", async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({ ...input, communityId: "community-1", subGroupId: "elsewhere" }),
    ).rejects.toThrow(SubGroupNotFoundError);
  });
});
