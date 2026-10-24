import type { Community } from "../../domain/community.entity";
import { CommunityNotFoundError, PrivateCommunityError } from "../../domain/community.errors";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import type { BubbleMembershipSync } from "../../services/bubble-membership";

interface JoinCommunityInput {
  communityId: string;
  userId: string;
}

export class JoinCommunityUseCase {
  constructor(
    private readonly communityRepository: CommunityRepositoryPort,
    private readonly bubbleMembership: Pick<BubbleMembershipSync, "addMembers">,
  ) {}

  /**
   * Adds the already-authenticated user as a member of the community, then to the Rainbow
   * bubbles of its channels so their messages also reach them in Rainbow. Returns the community
   * so the caller can expose its sub-groups, making its exchanges accessible right after joining.
   * `addMember` rejects with `AlreadyMemberError` if the membership already exists.
   */
  async execute(input: JoinCommunityInput): Promise<Community> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError();
    if (community.isPrivate) throw new PrivateCommunityError();

    await this.communityRepository.addMember(input.communityId, input.userId);
    await this.bubbleMembership.addMembers(
      community.subGroups.map((subGroup) => subGroup.rainbowBubbleId),
      [input.userId],
    );
    return community;
  }
}
