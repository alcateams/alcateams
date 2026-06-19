import { useQuery } from '@tanstack/react-query'
import { type Community } from '@/types/api'
import { api } from '@/lib/api-client'

export const myCommunitiesQueryKey = ['communities', 'me']

const getMyCommunities = (): Promise<Community[]> => {
  return api.get('/api/communities/me')
}

export const useMyCommunities = () => {
  return useQuery({
    queryKey: myCommunitiesQueryKey,
    queryFn: getMyCommunities,
  })
}
