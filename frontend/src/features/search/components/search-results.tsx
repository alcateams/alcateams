import { AxiosError } from 'axios'
import { format } from 'date-fns'
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type MessageSearchPage, type MessageSearchResult } from '@/types/api'
import { fr } from 'date-fns/locale'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SearchResultsProps = {
  query: UseInfiniteQueryResult<InfiniteData<MessageSearchPage>>
  hasQuery: boolean
}

export function SearchResults({ query, hasQuery }: SearchResultsProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = query

  if (!hasQuery) {
    return (
      <p className='text-sm text-muted-foreground'>
        Saisissez un mot ou un pseudo pour lancer la recherche.
      </p>
    )
  }
  if (isLoading) {
    return <p className='text-sm text-muted-foreground'>Recherche…</p>
  }
  if (isError) {
    const unavailable =
      error instanceof AxiosError && error.response?.status === 503
    return (
      <p className='text-sm text-destructive'>
        {unavailable
          ? "La recherche n'est pas disponible pour le moment."
          : 'Impossible de lancer la recherche. Réessayez plus tard.'}
      </p>
    )
  }

  const results = data?.pages.flatMap((page) => page.results) ?? []
  if (results.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>Aucun message trouvé.</p>
    )
  }

  const total = data?.pages[0]?.total ?? results.length
  return (
    <section aria-label='Résultats' className='flex flex-col gap-3'>
      <p className='text-sm text-muted-foreground'>
        {total > 1 ? `Environ ${total} messages` : '1 message'}
      </p>
      <ul className='flex flex-col divide-y rounded-md border'>
        {results.map((result) => (
          <li key={result.id}>
            <SearchResultItem result={result} />
          </li>
        ))}
      </ul>
      {hasNextPage && (
        <Button
          variant='outline'
          className='self-center'
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Chargement…' : 'Plus de résultats'}
        </Button>
      )}
    </section>
  )
}

function SearchResultItem({ result }: { result: MessageSearchResult }) {
  const date = new Date(result.createdAt)
  return (
    <Link
      to='/communities/$communityId'
      params={{ communityId: result.community.id }}
      search={{ channel: result.subGroup.id }}
      className='flex flex-col gap-1 px-4 py-3 hover:bg-accent'
    >
      <span className='flex min-w-0 items-center gap-1 text-xs text-muted-foreground'>
        <span className='truncate'>{result.community.name}</span>
        <ChevronRight className='size-3 shrink-0' />
        <span className='truncate'># {result.subGroup.name}</span>
      </span>
      <span className='flex items-baseline gap-2'>
        <span className='text-sm font-medium'>{result.author.pseudo}</span>
        <time
          dateTime={result.createdAt}
          className='text-xs text-muted-foreground'
        >
          {format(date, "d MMM yyyy 'à' HH:mm", { locale: fr })}
        </time>
      </span>
      <p className='text-sm break-words whitespace-pre-wrap'>
        {result.snippet.map((part, index) =>
          part.highlighted ? (
            <mark
              key={index}
              className='rounded-sm bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-500/40'
            >
              {part.text}
            </mark>
          ) : (
            <span key={index}>{part.text}</span>
          )
        )}
      </p>
    </Link>
  )
}
