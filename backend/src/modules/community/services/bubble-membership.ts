import type { AdminSessionPort } from "../../auth/admin-session.port";
import type { CommunityProviderPort } from "../provider/community-provider.port";

const MAX_CONCURRENT_ADDITIONS = 10;

type MembershipChange = (adminToken: string, bubbleId: string, userId: string) => Promise<void>;

/**
 * Mirrors community membership into the sub-groups' Rainbow bubbles, using the admin account
 * (a moderator of every bubble) since only moderators can add or remove members.
 *
 * Best effort: the database is the source of truth for membership and messages, so a Rainbow
 * failure is logged rather than propagated. It is expected for communities created before the
 * admin was made moderator of their bubbles.
 */
export class BubbleMembershipSync {
  constructor(
    private readonly communityProvider: CommunityProviderPort,
    private readonly adminSession: AdminSessionPort,
  ) {}

  async addMembers(bubbleIds: readonly string[], userIds: readonly string[]): Promise<void> {
    await this.applyToEachMembership(bubbleIds, userIds, "ajout", (adminToken, bubbleId, userId) =>
      this.communityProvider.addMember(adminToken, bubbleId, userId, "user"),
    );
  }

  async removeMembers(bubbleIds: readonly string[], userIds: readonly string[]): Promise<void> {
    await this.applyToEachMembership(
      bubbleIds,
      userIds,
      "retrait",
      (adminToken, bubbleId, userId) =>
        this.communityProvider.removeMember(adminToken, bubbleId, userId),
    );
  }

  private async applyToEachMembership(
    bubbleIds: readonly string[],
    userIds: readonly string[],
    label: string,
    change: MembershipChange,
  ): Promise<void> {
    if (bubbleIds.length === 0 || userIds.length === 0) return;

    try {
      const admin = await this.adminSession.getAdminSession();
      const changes = bubbleIds.flatMap((bubbleId) =>
        userIds
          // The admin moderates every bubble and must stay in it.
          .filter((userId) => userId !== admin.userId)
          .map((userId) => ({ bubbleId, userId })),
      );
      // Bounded batches: a large community must not fire hundreds of Rainbow calls at once.
      for (let i = 0; i < changes.length; i += MAX_CONCURRENT_ADDITIONS) {
        await Promise.all(
          changes.slice(i, i + MAX_CONCURRENT_ADDITIONS).map(({ bubbleId, userId }) =>
            change(admin.token, bubbleId, userId).catch((error: unknown) => {
              console.error(
                `[bubble-membership] ${label} de ${userId} dans la bulle ${bubbleId} impossible :`,
                error,
              );
            }),
          ),
        );
      }
    } catch (error) {
      console.error("[bubble-membership] session administrateur indisponible :", error);
    }
  }
}
