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
