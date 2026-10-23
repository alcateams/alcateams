import type { Community } from "../domain/community.entity";
import { CommunityNotFoundError, NotCommunityMemberError } from "../domain/community.errors";
import type { CommunityRole } from "../domain/community.types";
import type { CommunityRepositoryPort } from "../database/community.repository.port";

export interface CommunityAccess {
  community: Community;
  role: CommunityRole;
}

/**
 * Loads a community the user belongs to. Throws `CommunityNotFoundError` if it doesn't exist and
 * `NotCommunityMemberError` if the user isn't a member: only members can read its exchanges.
 */
export async function loadCommunityForMember(
  communityRepository: CommunityRepositoryPort,
  communityId: string,
  userId: string,
): Promise<CommunityAccess> {
  const [community, role] = await Promise.all([
    communityRepository.findById(communityId),
    communityRepository.findMemberRole(communityId, userId),
  ]);
  if (!community) throw new CommunityNotFoundError();
  if (!role) throw new NotCommunityMemberError();
  return { community, role };
}
