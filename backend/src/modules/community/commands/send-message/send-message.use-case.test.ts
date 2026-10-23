import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotCommunityMemberError, SubGroupNotFoundError } from "../../domain/community.errors";
import {
  makeCommunity,
  makeCommunityRepository,
  makeMessageIndexer,
  makeMessageRepository,
  makeMessagingProvider,
} from "../../testing/test-doubles";
import { SendMessageUseCase } from "./send-message.use-case";

const input = {
  communityId: "community-1",
  subGroupId: "sub-1",
  authorId: "user-1",
  authorToken: "user-token",
  text: "Bonjour",
};

const setup = () => {
  const communities = makeCommunityRepository();
  communities.findById.mockResolvedValue(makeCommunity());
  const messages = makeMessageRepository();
  const messaging = makeMessagingProvider();
  const indexer = makeMessageIndexer();
  const useCase = new SendMessageUseCase(communities, messages, messaging, indexer);
  return { communities, messages, messaging, indexer, useCase };
};

describe("SendMessageUseCase", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("stores the message, then mirrors it to the channel's bubble as the author", async () => {
    const { messages, messaging, useCase } = setup();

    const { message, delivery } = await useCase.execute(input);
    await delivery;

    expect(messages.save).toHaveBeenCalledWith({
      subGroupId: "sub-1",
      authorId: "user-1",
      text: "Bonjour",
    });
    expect(messaging.sendMessage).toHaveBeenCalledWith("user-token", "user-1", {
      bubbleId: "bubble-sub-1",
      text: "Bonjour",
    });
    expect(messages.updateRainbowSync).toHaveBeenCalledWith(
      message.id,
      "SYNCED",
      "rainbow-message-1",
    );
  });

  it("keeps the message and marks it FAILED when Rainbow rejects it", async () => {
    const { messages, messaging, useCase } = setup();
    messaging.sendMessage.mockRejectedValue(new Error("403"));

    const { message, delivery } = await useCase.execute(input);
    await expect(delivery).resolves.toBeUndefined();

    expect(messages.updateRainbowSync).toHaveBeenCalledWith(message.id, "FAILED", undefined);
  });

  it("does not flag a message Rainbow accepted as FAILED when the SYNCED update fails", async () => {
    const { messages, useCase } = setup();
    messages.updateRainbowSync.mockRejectedValue(new Error("db down"));

    const { message, delivery } = await useCase.execute(input);
    await expect(delivery).resolves.toBeUndefined();

    expect(messages.updateRainbowSync).toHaveBeenCalledTimes(1);
    expect(messages.updateRainbowSync).toHaveBeenCalledWith(
      message.id,
      "SYNCED",
      "rainbow-message-1",
    );
  });

  it("indexes the message with its community, and survives an indexer failure", async () => {
    const { indexer, useCase } = setup();
    indexer.index.mockRejectedValue(new Error("search down"));

    const { message, delivery } = await useCase.execute(input);
    await expect(delivery).resolves.toBeUndefined();

    expect(indexer.index).toHaveBeenCalledWith({ ...message, communityId: "community-1" });
  });

  it("rejects non-members before storing anything", async () => {
    const { communities, messages, useCase } = setup();
    communities.findMemberRole.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotCommunityMemberError);
    expect(messages.save).not.toHaveBeenCalled();
  });

  it("rejects a sub-group of another community", async () => {
    const { messages, useCase } = setup();

    await expect(useCase.execute({ ...input, subGroupId: "elsewhere" })).rejects.toThrow(
      SubGroupNotFoundError,
    );
    expect(messages.save).not.toHaveBeenCalled();
  });
});
