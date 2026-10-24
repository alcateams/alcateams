import { describe, expect, it } from "vitest";
import { createCommunityDto } from "./create-community.request.dto";

const base = { name: "Chess club", description: "desc" };

describe("createCommunityDto", () => {
  it("accepts distinct sub-group names", () => {
    const result = createCommunityDto.safeParse({
      ...base,
      subGroups: [
        { name: "Openings", theme: "Theory" },
        { name: "Endgames", theme: "Theory" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("defaults communities to public", () => {
    const result = createCommunityDto.safeParse({
      ...base,
      subGroups: [{ name: "Openings", theme: "Theory" }],
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isPrivate).toBe(false);
  });

  it("accepts private communities", () => {
    const result = createCommunityDto.safeParse({
      ...base,
      isPrivate: true,
      subGroups: [{ name: "Openings", theme: "Theory" }],
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isPrivate).toBe(true);
  });

  it("rejects duplicate sub-group names, case-insensitively", () => {
    const result = createCommunityDto.safeParse({
      ...base,
      subGroups: [
        { name: "Openings", theme: "Theory" },
        { name: " openings ", theme: "Practice" },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("createCommunityDto reserved names", () => {
  it.each(["Général", " general ", "GÉNÉRAL"])("rejects the reserved name %j", (name) => {
    const result = createCommunityDto.safeParse({
      ...base,
      subGroups: [{ name, theme: "Theory" }],
    });
    expect(result.success).toBe(false);
  });
});
