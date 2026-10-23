import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { type User } from '@/types/api'

export const currentUserQueryKey = ['current-user']

const getCurrentUser = (): Promise<User> => {
  return api.get('/api/users/me')
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    staleTime: Infinity,
  })
}
