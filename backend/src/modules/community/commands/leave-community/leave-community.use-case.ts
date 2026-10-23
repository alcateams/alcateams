import {
  CommunityNotFoundError,
  LastModeratorError,
  NotCommunityMemberError,
} from "../../domain/community.errors";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import type { BubbleMembershipSync } from "../../services/bubble-membership";

interface LeaveCommunityInput {
  communityId: string;
  userId: string;
}

export class LeaveCommunityUseCase {
  constructor(
    private readonly communityRepository: CommunityRepositoryPort,
    private readonly bubbleMembership: Pick<BubbleMembershipSync, "removeMembers">,
  ) {}

  /**
   * Removes the already-authenticated user from the community, then from the Rainbow bubbles of
   * its channels so its messages stop reaching them in Rainbow. The last moderator cannot leave:
   * the community would be left without anyone to manage it.
   */
  async execute(input: LeaveCommunityInput): Promise<void> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError();

    const role = await this.communityRepository.findMemberRole(input.communityId, input.userId);
    if (!role) throw new NotCommunityMemberError();

    if (role === "MODERATOR") {
      const moderatorCount = await this.communityRepository.countModerators(input.communityId);
      if (moderatorCount <= 1) throw new LastModeratorError();
    }

    await this.communityRepository.removeMember(input.communityId, input.userId);
    await this.bubbleMembership.removeMembers(
      community.subGroups.map((subGroup) => subGroup.rainbowBubbleId),
      [input.userId],
    );
  }
}
