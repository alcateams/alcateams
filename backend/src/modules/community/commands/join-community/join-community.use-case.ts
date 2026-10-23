import type { Community } from "../../domain/community.entity";
import { CommunityNotFoundError } from "../../domain/community.errors";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";

interface JoinCommunityInput {
  communityId: string;
  userId: string;
}

export class JoinCommunityUseCase {
  constructor(private readonly communityRepository: CommunityRepositoryPort) {}

  /**
   * Adds the already-authenticated user as a member of the community. Returns the community so
   * the caller can expose its sub-groups, making its exchanges accessible right after joining.
   * `addMember` rejects with `AlreadyMemberError` if the membership already exists.
   */
  async execute(input: JoinCommunityInput): Promise<Community> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError();

    await this.communityRepository.addMember(input.communityId, input.userId);
    return community;
  }
}
