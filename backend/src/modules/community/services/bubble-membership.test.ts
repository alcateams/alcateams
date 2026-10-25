import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN, makeAdminSession, makeCommunityProvider } from "../testing/test-doubles";
import { BubbleMembershipSync } from "./bubble-membership";

describe("BubbleMembershipSync", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("adds every user to every bubble with the admin token, skipping the admin", async () => {
    const provider = makeCommunityProvider();

    await new BubbleMembershipSync(provider, makeAdminSession()).addMembers(
      ["b1", "b2"],
      ["u1", ADMIN.userId],
    );

    expect(provider.addMember.mock.calls).toEqual([
      [ADMIN.token, "b1", "u1", "user"],
      [ADMIN.token, "b2", "u1", "user"],
    ]);
  });

  it("logs Rainbow failures instead of propagating them", async () => {
    const provider = makeCommunityProvider();
    provider.addMember.mockRejectedValueOnce(new Error("403"));

    await expect(
      new BubbleMembershipSync(provider, makeAdminSession()).addMembers(["b1", "b2"], ["u1"]),
    ).resolves.toBeUndefined();
    expect(provider.addMember).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("removes every user from every bubble with the admin token, keeping the admin", async () => {
    const provider = makeCommunityProvider();

    await new BubbleMembershipSync(provider, makeAdminSession()).removeMembers(
      ["b1", "b2"],
      ["u1", ADMIN.userId],
    );

    expect(provider.removeMember.mock.calls).toEqual([
      [ADMIN.token, "b1", "u1"],
      [ADMIN.token, "b2", "u1"],
    ]);
  });

  it("logs Rainbow removal failures instead of propagating them", async () => {
    const provider = makeCommunityProvider();
    provider.removeMember.mockRejectedValueOnce(new Error("403"));

    await expect(
      new BubbleMembershipSync(provider, makeAdminSession()).removeMembers(["b1", "b2"], ["u1"]),
    ).resolves.toBeUndefined();
    expect(provider.removeMember).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("logs an unavailable admin session instead of propagating it", async () => {
    const adminSession = makeAdminSession();
    adminSession.getAdminSession.mockRejectedValue(new Error("login failed"));

    await expect(
      new BubbleMembershipSync(makeCommunityProvider(), adminSession).addMembers(["b1"], ["u1"]),
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
