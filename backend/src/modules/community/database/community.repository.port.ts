import type { Community } from "../domain/community.entity";

export interface CommunityRepositoryPort {
  /** Persists the community together with its sub-groups and the creator as a moderator. */
  save(community: Community, creatorId: string): Promise<Community>;
  findByName(name: string): Promise<Community | null>;
  listForUser(userId: string): Promise<Community[]>;
}
