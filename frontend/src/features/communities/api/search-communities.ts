import { useQuery } from '@tanstack/react-query'
import { type Community } from '@/types/api'
import { api } from '@/lib/api-client'

export const MIN_SEARCH_LENGTH = 2

const searchCommunities = (term: string): Promise<Community[]> => {
  return api.get('/api/communities/search', { params: { q: term } })
}

export const useSearchCommunities = (term: string) => {
  const trimmed = term.trim()
  const enabled = trimmed.length >= MIN_SEARCH_LENGTH

  return useQuery({
    queryKey: ['communities', 'search', trimmed],
    queryFn: () => searchCommunities(trimmed),
    enabled,
  })
}
