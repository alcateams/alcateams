import { Fragment } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { type Message, type MessagePage } from '@/types/api'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PENDING_MESSAGE_PREFIX } from '../../api/channel-messages'

type MessageListProps = {
  query: UseInfiniteQueryResult<InfiniteData<MessagePage>>
  currentUserId: string | undefined
  className?: string
}

function formatDay(date: Date): string {
  if (isToday(date)) return "Aujourd'hui"
  if (isYesterday(date)) return 'Hier'
  return format(date, 'd MMMM yyyy', { locale: fr })
}

/** Splits newest-first messages into consecutive runs posted on the same day. */
function groupByDay(messages: Message[]) {
  const groups: { day: string; messages: Message[] }[] = []
  for (const message of messages) {
    const day = formatDay(new Date(message.createdAt))
    const current = groups[groups.length - 1]
    if (current?.day === day) current.messages.push(message)
    else groups.push({ day, messages: [message] })
  }
  return groups
}

export function MessageList({
  query,
  currentUserId,
  className,
}: MessageListProps) {
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = query

  if (isLoading) {
    return (
      <p className={cn('p-4 text-sm text-muted-foreground', className)}>
        Chargement des messages…
      </p>
    )
  }

  if (isError) {
    return (
      <p className={cn('p-4 text-sm text-destructive', className)}>
        Impossible de charger les messages. Réessayez plus tard.
      </p>
    )
  }

  const messages = data?.pages.flatMap((page) => page.messages) ?? []

  if (messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        <p className='text-sm text-muted-foreground'>
          Aucun message pour l'instant. Lancez la discussion !
        </p>
      </div>
    )
  }

  return (
    // `flex-col-reverse` renders newest-first data bottom-up and keeps the view pinned to
    // the latest message as new ones arrive.
    <div
      className={cn(
        'flex flex-col-reverse gap-3 overflow-y-auto px-4 py-4',
        className
      )}
      role='log'
      aria-live='polite'
      aria-label='Messages'
    >
      {groupByDay(messages).map(({ day, messages: dayMessages }) => (
        <Fragment key={`${day}-${dayMessages[0].id}`}>
          {dayMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.author.id === currentUserId}
            />
          ))}
          <div className='py-1 text-center text-xs text-muted-foreground'>
            {day}
          </div>
        </Fragment>
      ))}
      {hasNextPage && (
        <div className='flex justify-center'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage
              ? 'Chargement…'
              : 'Charger les messages précédents'}
          </Button>
        </div>
      )}
    </div>
  )
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message
  isOwn: boolean
}) {
  const isPending = message.id.startsWith(PENDING_MESSAGE_PREFIX)
  const createdAt = new Date(message.createdAt)

  return (
    <div
      className={cn(
        'flex max-w-[80%] flex-col gap-1 sm:max-w-md',
        isOwn ? 'items-end self-end' : 'items-start self-start'
      )}
    >
      <div className='flex items-baseline gap-2 px-1 text-xs text-muted-foreground'>
        <span className='font-medium text-foreground'>
          {isOwn ? 'Vous' : message.author.pseudo}
        </span>
        <time
          dateTime={message.createdAt}
          title={createdAt.toLocaleString('fr-FR')}
        >
          {isPending ? 'Envoi…' : format(createdAt, 'HH:mm')}
        </time>
      </div>
      <p
        className={cn(
          'px-3 py-2 wrap-break-word whitespace-pre-wrap shadow-sm',
          isOwn
            ? 'rounded-[16px_16px_0_16px] bg-primary/90 text-primary-foreground'
            : 'rounded-[16px_16px_16px_0] bg-muted',
          isPending && 'opacity-60'
        )}
      >
        {message.text}
      </p>
    </div>
  )
}
