import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { type MessageSearchPage, type MessageSearchSort } from '@/types/api'
import { api } from '@/lib/api-client'

const PAGE_SIZE = 20

export type MessageSearchParams = {
  q: string
  /** All of the user's communities when absent. */
  communityId?: string
  /** One channel of `communityId`. */
  subGroupId?: string
  sort: MessageSearchSort
}

const searchMessages = (
  params: MessageSearchParams,
  offset: number
): Promise<MessageSearchPage> => {
  return api.get('/api/search/messages', {
    params: { ...params, offset, limit: PAGE_SIZE },
  })
}

export const useSearchMessages = (params: MessageSearchParams) => {
  return useInfiniteQuery({
    queryKey: ['search', 'messages', params],
    queryFn: ({ pageParam }) => searchMessages(params, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    enabled: params.q.trim().length > 0,
    // Keep showing the previous results while the next query loads, instead of flashing empty.
    placeholderData: keepPreviousData,
  })
}
