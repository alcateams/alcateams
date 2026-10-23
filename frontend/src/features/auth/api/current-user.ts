import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type User } from '@/types/api'
import { api } from '@/lib/api-client'

export const currentUserQueryKey = ['current-user']

export type UpdateProfileInput = {
  pseudo: string
  email: string
  bio: string | null
  urls: string[]
}

const getCurrentUser = (): Promise<User> => {
  return api.get('/api/users/me')
}

const updateCurrentUser = (data: UpdateProfileInput): Promise<User> => {
  return api.patch('/api/users/me', data)
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    staleTime: Infinity,
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User>(currentUserQueryKey, updatedUser)
    },
  })
}
