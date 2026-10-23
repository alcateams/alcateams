import type { Community } from "../domain/community.entity";
import type { CommunityMemberDetails, CommunityRole } from "../domain/community.types";

/** A community the user belongs to, paired with the role the user holds in it. */
export interface CommunityWithRole {
  community: Community;
  myRole: CommunityRole;
}

export interface CommunityRepositoryPort {
  /** Persists the community together with its sub-groups and the creator as a moderator. */
  save(community: Community, creatorId: string): Promise<Community>;
  findByName(name: string): Promise<Community | null>;
  findById(id: string): Promise<Community | null>;
  listForUser(userId: string): Promise<Community[]>;
  /** Lists the user's communities together with the role the user holds in each one. */
  listForUserWithRole(userId: string): Promise<CommunityWithRole[]>;
  /** Returns communities whose name or description matches the search term. */
  search(term: string): Promise<Community[]>;
  /** Adds the user as a member of the community. Throws `AlreadyMemberError` if already a member. */
  addMember(communityId: string, userId: string): Promise<void>;
  /** Returns the role the user holds in the community, or `null` if they are not a member. */
  findMemberRole(communityId: string, userId: string): Promise<CommunityRole | null>;
  /** Lists every member of the community with their public identity (moderator-only data). */
  listMembers(communityId: string): Promise<CommunityMemberDetails[]>;
  /** Counts how many members hold the `MODERATOR` role in the community. */
  countModerators(communityId: string): Promise<number>;
  /**
   * Atomically updates the member's role and creates the matching `ROLE_CHANGED` notification,
   * so a member is never left without the notification for a role change that did happen.
   */
  changeRoleAndNotify(
    communityId: string,
    targetUserId: string,
    newRole: CommunityRole,
  ): Promise<void>;
}
