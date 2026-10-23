import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../config/rainbow.config", () => ({
  rainbowConfig: { host: "https://rainbow.test" },
}));

import { BubbleCreationFailedError } from "./community-provider.errors";
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
});
