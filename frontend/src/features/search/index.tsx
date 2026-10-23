import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { type MessageSearchSort } from '@/types/api'
import { Search as SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useMyCommunities } from '../communities/api/get-my-communities'
import { useSearchMessages } from './api/search-messages'
import { SearchResults } from './components/search-results'

const route = getRouteApi('/_authenticated/search/')

// Radix Select doesn't allow an empty value, so "no filter" gets its own.
const ALL = 'all'
const TYPING_DELAY_MS = 300

export function MessageSearch() {
  const { q = '', community, channel, sort = 'relevance' } = route.useSearch()
  const navigate = route.useNavigate()
  const { data: communities } = useMyCommunities()

  // The URL follows the input after a short pause, so each keystroke doesn't fire a search.
  const [text, setText] = useState(q)
  useEffect(() => {
    if (text.trim() === q) return
    const timeout = setTimeout(
      () =>
        navigate({
          search: (prev) => ({ ...prev, q: text.trim() || undefined }),
          replace: true,
        }),
      TYPING_DELAY_MS
    )
    return () => clearTimeout(timeout)
  }, [text, q, navigate])

  const selectedCommunity = communities?.find(({ id }) => id === community)
  const query = useSearchMessages({
    q,
    communityId: community,
    // Ignore a channel left over from another community.
    subGroupId: selectedCommunity?.subGroups.some(({ id }) => id === channel)
      ? channel
      : undefined,
    sort,
  })

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Recherche</h2>
          <p className='text-muted-foreground'>
            Retrouvez un message dans les communautés dont vous faites partie.
          </p>
        </div>

        <div className='flex flex-col gap-2 lg:flex-row'>
          <div className='relative flex-1'>
            <SearchIcon
              aria-hidden='true'
              className='absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              type='search'
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder='Rechercher des messages…'
              aria-label='Rechercher des messages'
              maxLength={200}
              autoFocus
              className='ps-9'
            />
          </div>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Select
              value={selectedCommunity ? community : ALL}
              onValueChange={(value) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    community: value === ALL ? undefined : value,
                    channel: undefined,
                  }),
                  replace: true,
                })
              }
            >
              <SelectTrigger className='w-full sm:w-56' aria-label='Communauté'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Toutes mes communautés</SelectItem>
                {communities?.map(({ id, name }) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCommunity && (
              <Select
                value={
                  selectedCommunity.subGroups.some(({ id }) => id === channel)
                    ? channel
                    : ALL
                }
                onValueChange={(value) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      channel: value === ALL ? undefined : value,
                    }),
                    replace: true,
                  })
                }
              >
                <SelectTrigger className='w-full sm:w-48' aria-label='Canal'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tous les canaux</SelectItem>
                  {selectedCommunity.subGroups.map(({ id, name }) => (
                    <SelectItem key={id} value={id}>
                      # {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={sort}
              onValueChange={(value) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    sort:
                      value === 'relevance'
                        ? undefined
                        : (value as MessageSearchSort),
                  }),
                  replace: true,
                })
              }
            >
              <SelectTrigger className='w-full sm:w-40' aria-label='Tri'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='relevance'>Pertinence</SelectItem>
                <SelectItem value='recent'>Plus récents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SearchResults query={query} hasQuery={q.length > 0} />
      </Main>
    </>
  )
}
