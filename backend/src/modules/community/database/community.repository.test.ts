import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.hoisted(() => vi.fn());
vi.mock("../../../lib/database", () => ({ database: { community: { create } } }));

import { Prisma } from "../../../generated/prisma/client";
import { Community } from "../domain/community.entity";
import { CommunityNameAlreadyTakenError } from "../domain/community.errors";
import { CommunityRepository } from "./community.repository";

const community = Community.create({
  name: "Chess club",
  description: "desc",
  subGroups: [{ name: "Openings", theme: "Theory", rainbowBubbleId: "b1" }],
});

const p2002 = (meta: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError("unique", {
    code: "P2002",
    clientVersion: "test",
    meta,
  });

const saveFailingWith = async (error: unknown) => {
  create.mockImplementation(() => Promise.reject(error));
  return new CommunityRepository().save(community, "u1").then(
    () => undefined,
    (thrown: unknown) => thrown,
  );
};

describe("CommunityRepository.save", () => {
  beforeEach(() => {
    create.mockReset();
  });

  it("translates a Community name violation into CommunityNameAlreadyTakenError", async () => {
    const thrown = await saveFailingWith(p2002({ target: "Community_name_key" }));
    expect(thrown).toBeInstanceOf(CommunityNameAlreadyTakenError);
  });

  it("translates a column-based Community target too", async () => {
    const thrown = await saveFailingWith(p2002({ modelName: "Community", target: ["name"] }));
    expect(thrown).toBeInstanceOf(CommunityNameAlreadyTakenError);
  });

  it("does not report a duplicate sub-group name as a community name conflict", async () => {
    const error = p2002({ modelName: "SubGroup", target: ["communityId", "name"] });
    expect(await saveFailingWith(error)).toBe(error);
  });
});
