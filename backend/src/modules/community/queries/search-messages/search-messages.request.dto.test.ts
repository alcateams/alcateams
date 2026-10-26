import { describe, expect, it } from "vitest";
import { searchMessagesDto } from "./search-messages.request.dto";

describe("searchMessagesDto", () => {
  it("trims the query and applies defaults", () => {
    expect(searchMessagesDto.parse({ q: "  échecs " })).toEqual({
      q: "échecs",
      sort: "relevance",
      limit: 20,
      offset: 0,
    });
  });

  it("rejects a blank query", () => {
    expect(searchMessagesDto.safeParse({ q: "   " }).success).toBe(false);
  });

  it("requires a community to search a channel", () => {
    expect(searchMessagesDto.safeParse({ q: "a", subGroupId: "s" }).success).toBe(false);
    expect(searchMessagesDto.safeParse({ q: "a", subGroupId: "s", communityId: "c" }).success).toBe(
      true,
    );
  });
});
