import { useQuery } from '@tanstack/react-query'
import { type CommunityMember } from '@/types/api'
import { api } from '@/lib/api-client'

export const communityMembersQueryKey = (communityId: string) => [
  'communities',
  communityId,
  'members',
]

const getCommunityMembers = (
  communityId: string
): Promise<CommunityMember[]> => {
  return api.get(`/api/communities/${communityId}/members`)
}

/**
 * Fetches the member list of a community. Reserved to moderators server-side, so `enabled`
 * lets the caller skip the request (and the guaranteed 403) for non-moderators.
 */
export const useCommunityMembers = (communityId: string, enabled: boolean) => {
  return useQuery({
    queryKey: communityMembersQueryKey(communityId),
    queryFn: () => getCommunityMembers(communityId),
    enabled,
  })
}
