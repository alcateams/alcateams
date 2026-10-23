import { afterEach, describe, expect, it, vi } from "vitest";
import { MeilisearchMessageSearch, toSnippet } from "./meilisearch-message-search.adapter";
import { MessageSearchUnavailableError } from "./message-search.errors";

const CONFIG = { host: "https://meili.test", apiKey: "key" };

const query = {
  query: "roi",
  communityIds: ["c1", 'c"2'],
  sort: "recent" as const,
  limit: 20,
  offset: 40,
};

const stubFetch = (response: Response) => {
  const fetchMock = vi.fn<typeof fetch>(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("toSnippet", () => {
  it("splits the formatted text on the highlight markers", () => {
    expect(toSnippet("…le roi et la reine")).toEqual([
      { text: "…le ", highlighted: false },
      { text: "roi", highlighted: true },
      { text: " et la ", highlighted: false },
      { text: "reine", highlighted: true },
    ]);
  });

  it("returns plain text as a single part", () => {
    expect(toSnippet("Bonjour")).toEqual([{ text: "Bonjour", highlighted: false }]);
  });
});

describe("MeilisearchMessageSearch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("filters on the given scope and maps the hits", async () => {
    const fetchMock = stubFetch(
      Response.json({
        hits: [
          {
            id: "m1",
            communityId: "c1",
            subGroupId: "s1",
            authorId: "u1",
            authorPseudo: "alice",
            text: "Le roi",
            createdAt: Date.parse("2026-10-23T10:00:00Z"),
            _formatted: { text: "Le roi" },
          },
        ],
        estimatedTotalHits: 41,
      }),
    );

    const result = await new MeilisearchMessageSearch(CONFIG).search({
      ...query,
      subGroupId: "s1",
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://meili.test/indexes/messages/search");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      q: "roi",
      filter: ['communityId IN ["c1", "c\\"2"]', 'subGroupId = "s1"'],
      sort: ["createdAt:desc"],
      limit: 20,
      offset: 40,
    });
    expect(result).toEqual({
      hits: [
        {
          id: "m1",
          communityId: "c1",
          subGroupId: "s1",
          authorId: "u1",
          authorPseudo: "alice",
          createdAt: new Date("2026-10-23T10:00:00Z"),
          snippet: [
            { text: "Le ", highlighted: false },
            { text: "roi", highlighted: true },
          ],
        },
      ],
      total: 41,
    });
  });

  it("does not query the engine without any community", async () => {
    const fetchMock = stubFetch(Response.json({}));
    await expect(
      new MeilisearchMessageSearch(CONFIG).search({ ...query, communityIds: [] }),
    ).resolves.toEqual({ hits: [], total: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports the engine as unavailable when it fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    stubFetch(Response.json({ message: "invalid key" }, { status: 403 }));
    await expect(new MeilisearchMessageSearch(CONFIG).search(query)).rejects.toThrow(
      MessageSearchUnavailableError,
    );
  });
});
