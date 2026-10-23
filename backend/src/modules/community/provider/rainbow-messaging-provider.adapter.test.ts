import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../config/rainbow.config", () => ({
  rainbowConfig: { host: "https://rainbow.test", s2sCallbackUrl: "https://cb.test" },
}));

import { MessageDeliveryFailedError } from "./messaging-provider.errors";
import { RainbowMessagingProvider } from "./rainbow-messaging-provider.adapter";

const message = { bubbleId: "room-1", text: "Bonjour" };

/** Answers each Rainbow call by method + path, and records the calls in order. */
const stubRainbow = (overrides: Record<string, Response> = {}) => {
  const routes: Record<string, () => Response> = {
    "POST /api/rainbow/ucs/v1.0/connections": () => Response.json({ data: { id: "cnx-1" } }),
    "POST /api/rainbow/ucs/v1.0/connections/cnx-1/rooms/room-1/join": () => Response.json({}),
    "POST /api/rainbow/enduser/v1.0/users/user-1/conversations": () =>
      Response.json({ data: { id: "conv-1" } }),
    "POST /api/rainbow/ucs/v1.0/connections/cnx-1/conversations/conv-1/messages": () =>
      Response.json({ data: { id: "msg-1" } }),
    "DELETE /api/rainbow/ucs/v1.0/connections/cnx-1": () => Response.json({}),
  };
  const fetchMock = vi.fn<typeof fetch>(async (url, init) => {
    const key = `${init?.method} ${new URL(String(url)).pathname}`;
    const response = overrides[key] ?? routes[key]?.();
    if (!response) throw new Error(`unexpected call ${key}`);
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    fetchMock,
    calls: () =>
      fetchMock.mock.calls.map(([url, init]) => `${init?.method} ${new URL(String(url)).pathname}`),
  };
};

describe("RainbowMessagingProvider", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends through a short-lived S2S connection and returns Rainbow's message id", async () => {
    const { fetchMock, calls } = stubRainbow();

    await expect(
      new RainbowMessagingProvider().sendMessage("token", "user-1", message),
    ).resolves.toBe("msg-1");

    expect(calls()).toEqual([
      "POST /api/rainbow/ucs/v1.0/connections",
      "POST /api/rainbow/ucs/v1.0/connections/cnx-1/rooms/room-1/join",
      "POST /api/rainbow/enduser/v1.0/users/user-1/conversations",
      "POST /api/rainbow/ucs/v1.0/connections/cnx-1/conversations/conv-1/messages",
      "DELETE /api/rainbow/ucs/v1.0/connections/cnx-1",
    ]);
    const bodies = fetchMock.mock.calls.map(
      ([, init]) => init?.body && JSON.parse(String(init.body)),
    );
    expect(bodies[0]).toEqual({ connection: { callback_url: "https://cb.test" } });
    expect(bodies[2]).toEqual({ peerId: "room-1", type: "room", mute: false });
    expect(bodies[3]).toEqual({ message: { body: "Bonjour", lang: "fr" } });
  });

  it("closes the connection and reports the failing step when sending fails", async () => {
    const { calls } = stubRainbow({
      "POST /api/rainbow/ucs/v1.0/connections/cnx-1/rooms/room-1/join": Response.json(
        { errorDetails: "not a member" },
        { status: 403 },
      ),
    });

    await expect(
      new RainbowMessagingProvider().sendMessage("token", "user-1", message),
    ).rejects.toThrow(new MessageDeliveryFailedError("join room", "not a member"));
    expect(calls().at(-1)).toBe("DELETE /api/rainbow/ucs/v1.0/connections/cnx-1");
  });

  it("still returns the message id when closing the connection fails", async () => {
    stubRainbow({
      "DELETE /api/rainbow/ucs/v1.0/connections/cnx-1": new Response("", { status: 500 }),
    });

    await expect(
      new RainbowMessagingProvider().sendMessage("token", "user-1", message),
    ).resolves.toBe("msg-1");
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("sends one user's messages one at a time, in order", async () => {
    let open = 0;
    let maxOpen = 0;
    const { fetchMock } = stubRainbow();
    const route = fetchMock.getMockImplementation();
    fetchMock.mockImplementation(async (url, init) => {
      const path = new URL(String(url)).pathname;
      if (init?.method === "POST" && path === "/api/rainbow/ucs/v1.0/connections") {
        maxOpen = Math.max(maxOpen, ++open);
      }
      if (init?.method === "DELETE") open--;
      await new Promise((resolve) => setTimeout(resolve, 1));
      return route!(url, init);
    });
    const provider = new RainbowMessagingProvider();

    await Promise.all(
      ["un", "deux", "trois"].map((text) =>
        provider.sendMessage("token", "user-1", { ...message, text }),
      ),
    );

    expect(maxOpen).toBe(1);
    const sent = fetchMock.mock.calls
      .filter(([url]) => String(url).endsWith("/messages"))
      .map(([, init]) => JSON.parse(String(init?.body)).message.body);
    expect(sent).toEqual(["un", "deux", "trois"]);
  });

  it("keeps sending after a failed message", async () => {
    const { fetchMock } = stubRainbow();
    const route = fetchMock.getMockImplementation();
    fetchMock.mockImplementationOnce(async () => new Response("", { status: 500 }));
    fetchMock.mockImplementation(route!);
    const provider = new RainbowMessagingProvider();

    const [first, second] = await Promise.allSettled([
      provider.sendMessage("token", "user-1", message),
      provider.sendMessage("token", "user-1", message),
    ]);

    expect(first.status).toBe("rejected");
    expect(second).toEqual({ status: "fulfilled", value: "msg-1" });
  });
});
