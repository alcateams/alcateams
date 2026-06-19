import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Community } from '@/types/api'
import { api } from '@/lib/api-client'
import { myCommunitiesQueryKey } from './get-my-communities'

const joinCommunity = (communityId: string): Promise<Community> => {
  return api.post(`/api/communities/${communityId}/join`)
}

type UseJoinCommunityOptions = {
  onSuccess?: (data: Community) => void
}

export const useJoinCommunity = ({
  onSuccess,
}: UseJoinCommunityOptions = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinCommunity,
    onSuccess: (data) => {
      // The user now belongs to this community, so refresh their membership list.
      queryClient.invalidateQueries({ queryKey: myCommunitiesQueryKey })
      onSuccess?.(data)
    },
  })
}
