import type { Community } from "../../domain/community.entity";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";

export class ListMyCommunitiesUseCase {
  constructor(private readonly communityRepository: CommunityRepositoryPort) {}

  // Token validation happens upstream in the `requireAuth` middleware; this use case
  // only lists the communities the already-authenticated user belongs to.
  async execute(userId: string): Promise<Community[]> {
    return this.communityRepository.listForUser(userId);
  }
}
