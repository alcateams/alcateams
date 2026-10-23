import type { Community } from "../domain/community.entity";
import type { CommunityRole, CreateSubGroupProps } from "../domain/community.types";

export interface CommunityRepositoryPort {
  /** Persists the community together with its sub-groups and the creator as a moderator. */
  save(community: Community, creatorId: string): Promise<Community>;
  findByName(name: string): Promise<Community | null>;
  findById(id: string): Promise<Community | null>;
  listForUser(userId: string): Promise<Community[]>;
  /** Returns communities whose name or description matches the search term. */
  search(term: string): Promise<Community[]>;
  /** Adds the user as a member of the community. Throws `AlreadyMemberError` if already a member. */
  addMember(communityId: string, userId: string): Promise<void>;
  /** Returns the user's role in the community, or `null` if they are not a member. */
  findMemberRole(communityId: string, userId: string): Promise<CommunityRole | null>;
  listMemberIds(communityId: string): Promise<string[]>;
  countModerators(communityId: string): Promise<number>;
  /** Removes the user from the community. Throws `NotCommunityMemberError` if not a member. */
  removeMember(communityId: string, userId: string): Promise<void>;
  /**
   * Adds a sub-group to an existing community. Throws `GeneralChannelAlreadyExistsError` if a
   * concurrent request already created the community's general channel.
   */
  addSubGroup(communityId: string, subGroup: CreateSubGroupProps): Promise<Community>;
}
