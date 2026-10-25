import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { myCommunitiesQueryKey } from './get-my-communities'

const leaveCommunity = (communityId: string): Promise<void> => {
  return api.post(`/api/communities/${communityId}/leave`)
}

type UseLeaveCommunityOptions = {
  onSuccess?: () => void
}

export const useLeaveCommunity = ({
  onSuccess,
}: UseLeaveCommunityOptions = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: leaveCommunity,
    onSuccess: () => {
      // The user no longer belongs to this community, so refresh their membership list.
      queryClient.invalidateQueries({ queryKey: myCommunitiesQueryKey })
      onSuccess?.()
    },
  })
}
