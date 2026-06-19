import type { Community } from "../domain/community.entity";

export interface CommunityRepositoryPort {
  /** Persists the community together with its themes and the creator as a moderator. */
  save(community: Community, creatorId: string): Promise<Community>;
  findByName(name: string): Promise<Community | null>;
  findById(id: string): Promise<Community | null>;
  listForUser(userId: string): Promise<Community[]>;
  /** Returns communities whose name or description matches the search term. */
  search(term: string): Promise<Community[]>;
  /** Adds the user as a member of the community. Throws `AlreadyMemberError` if already a member. */
  addMember(communityId: string, userId: string): Promise<void>;
}
