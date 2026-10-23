import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { type Message, type MessagePage, type User } from '@/types/api'
import { api } from '@/lib/api-client'

// How often an open channel checks for new messages.
const POLL_INTERVAL_MS = 3_000
const PAGE_SIZE = 50

/** Messages created locally and not yet confirmed by the server carry this id prefix. */
export const PENDING_MESSAGE_PREFIX = 'pending-'

export const channelMessagesQueryKey = (
  communityId: string,
  subGroupId: string
) => ['communities', communityId, 'channels', subGroupId, 'messages']

const messagesUrl = (communityId: string, subGroupId: string) =>
  `/api/communities/${communityId}/subgroups/${subGroupId}/messages`

const getMessages = (
  communityId: string,
  subGroupId: string,
  before: string | undefined
): Promise<MessagePage> => {
  return api.get(messagesUrl(communityId, subGroupId), {
    params: { before, limit: PAGE_SIZE },
  })
}

/**
 * A channel's history, newest page first. Polls for new messages while mounted; the
 * pages already loaded are refetched too, which is fine at this volume.
 */
export const useChannelMessages = (communityId: string, subGroupId: string) => {
  return useInfiniteQuery({
    queryKey: channelMessagesQueryKey(communityId, subGroupId),
    queryFn: ({ pageParam }) => getMessages(communityId, subGroupId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: POLL_INTERVAL_MS,
  })
}

type SendMessageInput = { text: string }

/** Posts a message, showing it in the thread immediately while the request is in flight. */
export const useSendMessage = (
  communityId: string,
  subGroupId: string,
  author: User | undefined
) => {
  const queryClient = useQueryClient()
  const queryKey = channelMessagesQueryKey(communityId, subGroupId)

  return useMutation({
    mutationFn: ({ text }: SendMessageInput): Promise<Message> =>
      api.post(messagesUrl(communityId, subGroupId), { text }),
    onMutate: async ({ text }) => {
      // Don't let an in-flight poll overwrite the optimistic message.
      await queryClient.cancelQueries({ queryKey })

      const pending: Message = {
        id: `${PENDING_MESSAGE_PREFIX}${Date.now()}-${Math.random()}`,
        text,
        author: { id: author?.id ?? '', pseudo: author?.pseudo ?? '' },
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData<InfiniteData<MessagePage>>(queryKey, (data) => {
        const [newest, ...older] = data?.pages ?? []
        if (!data || !newest) return data
        return {
          ...data,
          pages: [
            { ...newest, messages: [pending, ...newest.messages] },
            ...older,
          ],
        }
      })
      return { pendingId: pending.id }
    },
    onError: (_error, _input, context) => {
      // Drop only this send's optimistic message: others may still be in flight.
      queryClient.setQueryData<InfiniteData<MessagePage>>(queryKey, (data) =>
        data && {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            messages: page.messages.filter(
              (message) => message.id !== context?.pendingId
            ),
          })),
        }
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}
