import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type CommunityRole } from '@/types/api'
import { api } from '@/lib/api-client'
import { communityMembersQueryKey } from './get-community-members'

type ChangeMemberRoleInput = {
  communityId: string
  userId: string
  role: CommunityRole
}

const changeMemberRole = ({
  communityId,
  userId,
  role,
}: ChangeMemberRoleInput): Promise<{ userId: string; role: CommunityRole }> => {
  return api.patch(`/api/communities/${communityId}/members/${userId}/role`, {
    role,
  })
}

export const useChangeMemberRole = (communityId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: changeMemberRole,
    onSuccess: () => {
      // The member's role changed: refresh the member list so the table reflects it.
      queryClient.invalidateQueries({
        queryKey: communityMembersQueryKey(communityId),
      })
    },
  })
}
