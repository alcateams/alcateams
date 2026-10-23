import { useQuery } from '@tanstack/react-query'
import { type CommunityDetails } from '@/types/api'
import { api } from '@/lib/api-client'

export const communityQueryKey = (communityId: string) => [
  'communities',
  communityId,
]

const getCommunity = (communityId: string): Promise<CommunityDetails> => {
  return api.get(`/api/communities/${communityId}`)
}

export const useCommunity = (communityId: string) => {
  return useQuery({
    queryKey: communityQueryKey(communityId),
    queryFn: () => getCommunity(communityId),
  })
}
