import type { CommunityRepositoryPort } from "../../database/community.repository.port";
import { CommunityNotFoundError, NotCommunityModeratorError } from "../../domain/community.errors";
import type { CommunityMemberDetails } from "../../domain/community.types";
import { MODERATION_ROLES } from "../../domain/community.types";

interface ListMembersInput {
  communityId: string;
  callerId: string;
}

export class ListMembersUseCase {
  constructor(private readonly communityRepository: CommunityRepositoryPort) {}

  /**
   * Lists the members of a community. The member list exposes personal data (email), so it is
   * reserved to the community's moderators (`MODERATOR` or `COMODERATOR`); a plain member or a
   * non-member is rejected with `NotCommunityModeratorError`.
   */
  async execute(input: ListMembersInput): Promise<CommunityMemberDetails[]> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError();

    const callerRole = await this.communityRepository.findMemberRole(
      input.communityId,
      input.callerId,
    );
    if (!callerRole || !MODERATION_ROLES.includes(callerRole)) {
      throw new NotCommunityModeratorError();
    }

    return this.communityRepository.listMembers(input.communityId);
  }
}
