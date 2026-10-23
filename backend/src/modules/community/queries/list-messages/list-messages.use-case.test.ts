import { describe, expect, it } from "vitest";
import { NotCommunityMemberError, SubGroupNotFoundError } from "../../domain/community.errors";
import {
  makeCommunity,
  makeCommunityRepository,
  makeMessageRepository,
} from "../../testing/test-doubles";
import { ListMessagesUseCase } from "./list-messages.use-case";

const input = { communityId: "community-1", subGroupId: "sub-1", userId: "u1", limit: 20 };

const setup = () => {
  const communities = makeCommunityRepository();
  communities.findById.mockResolvedValue(makeCommunity());
  const messages = makeMessageRepository();
  return { communities, messages, useCase: new ListMessagesUseCase(communities, messages) };
};

describe("ListMessagesUseCase", () => {
  it("pages through the channel's messages", async () => {
    const { messages, useCase } = setup();

    await useCase.execute({ ...input, before: "m-9" });

    expect(messages.listBySubGroup).toHaveBeenCalledWith("sub-1", { before: "m-9", limit: 20 });
  });

  it("rejects non-members", async () => {
    const { communities, messages, useCase } = setup();
    communities.findMemberRole.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotCommunityMemberError);
    expect(messages.listBySubGroup).not.toHaveBeenCalled();
  });

  it("rejects a sub-group of another community", async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ ...input, subGroupId: "elsewhere" })).rejects.toThrow(
      SubGroupNotFoundError,
    );
  });
});
