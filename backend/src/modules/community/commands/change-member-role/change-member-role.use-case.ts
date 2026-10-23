import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import {
  CannotEditOwnRoleError,
  CommunityNotFoundError,
  LastModeratorError,
  MemberNotFoundError,
  NotCommunityModeratorError,
} from "../../domain/community.errors";
import type { CommunityRole } from "../../domain/community.types";

interface ChangeMemberRoleInput {
  communityId: string;
  callerId: string;
  targetUserId: string;
  newRole: CommunityRole;
}

export class ChangeMemberRoleUseCase {
  constructor(private readonly communityRepository: CommunityRepositoryPort) {}

  /**
   * Assigns a new role to a community member. Enforces, server-side:
   * - the caller is a `MODERATOR` of this community (403 otherwise);
   * - the caller cannot change their own role (403);
   * - the target must belong to the community (404);
   * - the last `MODERATOR` cannot be demoted, so a community always keeps one (409).
   *
   * The role change and its notification are written atomically by `changeRoleAndNotify`.
   */
  async execute(input: ChangeMemberRoleInput): Promise<{ userId: string; role: CommunityRole }> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError();

    const callerRole = await this.communityRepository.findMemberRole(
      input.communityId,
      input.callerId,
    );
    if (callerRole !== "MODERATOR") throw new NotCommunityModeratorError();

    if (input.targetUserId === input.callerId) throw new CannotEditOwnRoleError();

    const targetRole = await this.communityRepository.findMemberRole(
      input.communityId,
      input.targetUserId,
    );
    if (!targetRole) throw new MemberNotFoundError();

    // Demoting the last moderator would leave the community unmanaged, so forbid it. Co-moderators
    // do not count: the rule guards the `MODERATOR` role specifically.
    const isDemotingAModerator = targetRole === "MODERATOR" && input.newRole !== "MODERATOR";
    if (isDemotingAModerator) {
      const moderatorCount = await this.communityRepository.countModerators(input.communityId);
      if (moderatorCount <= 1) throw new LastModeratorError();
    }

    await this.communityRepository.changeRoleAndNotify(
      input.communityId,
      input.targetUserId,
      input.newRole,
    );

    return { userId: input.targetUserId, role: input.newRole };
  }
}
