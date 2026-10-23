import { afterEach, describe, expect, it, vi } from "vitest";
import { MeilisearchMessageIndexer } from "./meilisearch-message-indexer.adapter";
import type { IndexedMessage } from "./message-indexer.port";
import { MeilisearchRequestFailedError } from "./meilisearch.errors";

const CONFIG = { host: "https://meili.test", apiKey: "key" };

const message: IndexedMessage = {
  id: "message-1",
  communityId: "community-1",
  subGroupId: "sub-group-1",
  authorId: "user-1",
  authorPseudo: "alice",
  text: "Bonjour",
  rainbowSyncStatus: "PENDING",
  createdAt: new Date("2026-10-01T00:00:00Z"),
};

const accepted = () => Response.json({ taskUid: 1, status: "enqueued" }, { status: 202 });

const stubFetch = (...responses: Response[]) => {
  const fetchMock = vi.fn<typeof fetch>(async () => responses.shift() ?? accepted());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("MeilisearchMessageIndexer", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("configures the index once, then adds the documents", async () => {
    const fetchMock = stubFetch();
    const indexer = new MeilisearchMessageIndexer(CONFIG);

    await indexer.index([message]);
    await indexer.index([message]);

    const calls = fetchMock.mock.calls.map(([url, init]) => [init?.method, String(url)]);
    expect(calls).toEqual([
      ["PATCH", "https://meili.test/indexes/messages/settings"],
      ["POST", "https://meili.test/indexes/messages/documents?primaryKey=id"],
      ["POST", "https://meili.test/indexes/messages/documents?primaryKey=id"],
    ]);
    const [, init] = fetchMock.mock.calls[1]!;
    expect(init?.headers).toMatchObject({ Authorization: "Bearer key" });
    expect(JSON.parse(String(init?.body))).toEqual([
      {
        id: "message-1",
        communityId: "community-1",
        subGroupId: "sub-group-1",
        authorId: "user-1",
        authorPseudo: "alice",
        text: "Bonjour",
        createdAt: Date.parse("2026-10-01T00:00:00Z"),
      },
    ]);
  });

  it("reports Meilisearch's error message and retries the settings next time", async () => {
    const fetchMock = stubFetch(
      Response.json(
        { message: "The provided API key is invalid.", code: "invalid_api_key" },
        {
          status: 403,
        },
      ),
    );
    const indexer = new MeilisearchMessageIndexer(CONFIG);

    await expect(indexer.index([message])).rejects.toThrow(
      new MeilisearchRequestFailedError(
        "configuration de l'index",
        "The provided API key is invalid.",
      ),
    );
    await indexer.index([message]);

    expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual([
      "PATCH",
      "PATCH",
      "POST",
    ]);
  });

  it("falls back to the HTTP status for a non-JSON error body", async () => {
    stubFetch(accepted(), new Response("<html>Bad Gateway</html>", { status: 502 }));

    await expect(new MeilisearchMessageIndexer(CONFIG).index([message])).rejects.toThrow(
      new MeilisearchRequestFailedError("ajout des documents", "HTTP 502"),
    );
  });

  it("does nothing for an empty batch", async () => {
    const fetchMock = stubFetch();
    await new MeilisearchMessageIndexer(CONFIG).index([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
