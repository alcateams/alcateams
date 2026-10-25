import type {
  CommunityRepositoryPort,
  CommunityWithRole,
} from "../../database/community.repository.port";

export class ListMyCommunitiesUseCase {
  constructor(private readonly communityRepository: CommunityRepositoryPort) {}

  // Token validation happens upstream in the `requireAuth` middleware; this use case lists the
  // communities the already-authenticated user belongs to, each paired with the user's own role
  // so the UI can gate moderator-only actions (e.g. managing members).
  async execute(userId: string): Promise<CommunityWithRole[]> {
    return this.communityRepository.listForUserWithRole(userId);
  }
}
