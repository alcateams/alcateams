import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../config/rainbow.config", () => ({
  rainbowConfig: { host: "https://rainbow.test" },
}));

import {
  BubbleCreationFailedError,
  BubbleMemberAdditionFailedError,
  BubbleMemberRemovalFailedError,
} from "./community-provider.errors";
import { RainbowCommunityProvider } from "./rainbow-community-provider.adapter";

const stubFetch = (response: Response) => {
  const fetchMock = vi.fn<typeof fetch>(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("RainbowCommunityProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns the created room id and sends a timeout signal", async () => {
    const fetchMock = stubFetch(Response.json({ data: { id: "room-1" } }));

    await expect(
      new RainbowCommunityProvider().createBubble("t", { name: "n", topic: "x" }),
    ).resolves.toBe("room-1");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ signal: expect.any(AbortSignal) });
  });

  it("falls back to the HTTP status for a non-JSON error body", async () => {
    stubFetch(new Response("<html>Bad Gateway</html>", { status: 502 }));

    await expect(
      new RainbowCommunityProvider().createBubble("t", { name: "n", topic: "x" }),
    ).rejects.toThrow(new BubbleCreationFailedError("HTTP 502"));
  });

  it("uses Rainbow's errorDetails when the body is JSON", async () => {
    stubFetch(Response.json({ errorDetails: [{ msg: "a" }, { msg: "b" }] }, { status: 400 }));

    await expect(
      new RainbowCommunityProvider().createBubble("t", { name: "n", topic: "x" }),
    ).rejects.toThrow("a, b");
  });

  it("adds a member directly to the room, without an invitation", async () => {
    const fetchMock = stubFetch(Response.json({ data: {} }));

    await new RainbowCommunityProvider().addMember("t", "room-1", "user-1", "moderator");

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://rainbow.test/api/rainbow/enduser/v1.0/rooms/room-1/users");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      userId: "user-1",
      privilege: "moderator",
      status: "accepted",
    });
  });

  it("treats an existing member (409) as already added", async () => {
    stubFetch(Response.json({ errorDetails: "already member" }, { status: 409 }));

    await expect(
      new RainbowCommunityProvider().addMember("t", "room-1", "user-1", "user"),
    ).resolves.toBeUndefined();
  });

  it("reports other failures when adding a member", async () => {
    stubFetch(Response.json({ errorDetails: "Access denied" }, { status: 403 }));

    await expect(
      new RainbowCommunityProvider().addMember("t", "room-1", "user-1", "user"),
    ).rejects.toThrow(new BubbleMemberAdditionFailedError("Access denied"));
  });

  it("unsubscribes then deletes a member from the room", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json({ data: {} }));
    vi.stubGlobal("fetch", fetchMock);

    await new RainbowCommunityProvider().removeMember("t", "room-1", "user-1");

    const memberUrl = "https://rainbow.test/api/rainbow/enduser/v1.0/rooms/room-1/users/user-1";
    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      [memberUrl, "PUT"],
      [memberUrl, "DELETE"],
    ]);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      status: "unsubscribed",
    });
  });

  it("treats a user who is not in the room (404) as already removed", async () => {
    const fetchMock = stubFetch(Response.json({ errorDetails: "not found" }, { status: 404 }));

    await expect(
      new RainbowCommunityProvider().removeMember("t", "room-1", "user-1"),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports other failures when removing a member", async () => {
    stubFetch(Response.json({ errorDetails: "Access denied" }, { status: 403 }));

    await expect(
      new RainbowCommunityProvider().removeMember("t", "room-1", "user-1"),
    ).rejects.toThrow(new BubbleMemberRemovalFailedError("Access denied"));
  });
});
