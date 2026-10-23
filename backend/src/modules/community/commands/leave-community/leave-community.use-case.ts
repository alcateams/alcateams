import {
  CommunityNotFoundError,
  LastModeratorError,
  NotMemberError,
} from "../../domain/community.errors";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";

interface LeaveCommunityInput {
  communityId: string;
  userId: string;
}

export class LeaveCommunityUseCase {
  constructor(private readonly communityRepository: CommunityRepositoryPort) {}

  /**
   * Removes the already-authenticated user from the community. The last moderator cannot leave:
   * the community would be left without anyone to manage it (and its Rainbow bubbles).
   */
  async execute(input: LeaveCommunityInput): Promise<void> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError();

    const role = await this.communityRepository.findMemberRole(input.communityId, input.userId);
    if (!role) throw new NotMemberError();

    if (role === "MODERATOR") {
      const moderatorCount = await this.communityRepository.countModerators(input.communityId);
      if (moderatorCount <= 1) throw new LastModeratorError();
    }

    await this.communityRepository.removeMember(input.communityId, input.userId);
  }
}
