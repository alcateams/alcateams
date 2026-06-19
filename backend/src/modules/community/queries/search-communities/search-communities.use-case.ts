import type { Community } from "../../domain/community.entity";
import type { CommunityRepositoryPort } from "../../database/community.repository.port";

export class SearchCommunitiesUseCase {
  constructor(private readonly communityRepository: CommunityRepositoryPort) {}

  // Token validation happens upstream in the `requireAuth` middleware; this use case
  // only returns the communities whose name or description matches the search term.
  async execute(term: string): Promise<Community[]> {
    const trimmed = term.trim();
    if (trimmed.length === 0) return [];
    return this.communityRepository.search(trimmed);
  }
}
