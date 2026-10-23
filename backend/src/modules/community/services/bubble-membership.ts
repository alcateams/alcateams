import type { AdminSessionPort } from "../../auth/admin-session.port";
import type { CommunityProviderPort } from "../provider/community-provider.port";

/**
 * Mirrors community membership into the sub-groups' Rainbow bubbles, using the admin account
 * (a moderator of every bubble) since only moderators can add members.
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
    if (bubbleIds.length === 0 || userIds.length === 0) return;

    try {
      const admin = await this.adminSession.getAdminSession();
      const additions = bubbleIds.flatMap((bubbleId) =>
        userIds
          // The admin already moderates every bubble.
          .filter((userId) => userId !== admin.userId)
          .map((userId) =>
            this.communityProvider
              .addMember(admin.token, bubbleId, userId, "user")
              .catch((error: unknown) => {
                console.error(
                  `[bubble-membership] ajout de ${userId} à la bulle ${bubbleId} impossible :`,
                  error,
                );
              }),
          ),
      );
      await Promise.all(additions);
    } catch (error) {
      console.error("[bubble-membership] session administrateur indisponible :", error);
    }
  }
}
