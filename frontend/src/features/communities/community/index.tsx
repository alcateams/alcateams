import { AxiosError } from 'axios'
import { Link, getRouteApi } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useCommunity } from '../api/get-community'
import { ChannelList, ChannelSelect } from './components/channel-list'
import { ChannelThread } from './components/channel-thread'
import { CommunitySearchForm } from './components/community-search-form'

const route = getRouteApi('/_authenticated/communities/$communityId')

export function CommunityPage() {
  const { communityId } = route.useParams()
  const { channel: channelId } = route.useSearch()
  const navigate = route.useNavigate()
  const { data: community, isLoading, error } = useCommunity(communityId)

  const selectChannel = (channel: string) =>
    navigate({ search: { channel }, replace: true })

  // Fall back to the general channel when none (or an unknown one) is selected.
  const channel =
    community?.subGroups.find((subGroup) => subGroup.id === channelId) ??
    community?.subGroups.find((subGroup) => subGroup.kind === 'GENERAL') ??
    community?.subGroups[0]

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

      <Main fixed className='flex flex-col gap-4'>
        <div className='flex flex-none flex-wrap items-center gap-2'>
          <Button asChild size='icon' variant='ghost' className='-ms-2'>
            <Link to='/communities' aria-label='Retour aux communautés'>
              <ArrowLeft className='rtl:rotate-180' />
            </Link>
          </Button>
          <div className='min-w-0 flex-1'>
            <h2 className='truncate text-2xl font-bold tracking-tight'>
              {community?.name ?? 'Communauté'}
            </h2>
            {community && (
              <p className='truncate text-muted-foreground'>
                {community.description}
              </p>
            )}
          </div>
          {community && channel && (
            <CommunitySearchForm
              // Reset the scope when switching channels.
              key={channel.id}
              communityId={community.id}
              channel={channel}
            />
          )}
        </div>

        {isLoading && (
          <p className='text-muted-foreground'>Chargement de la communauté…</p>
        )}
        {error && <CommunityError error={error} />}

        {community && channel && (
          <section className='flex min-h-0 flex-1 flex-col gap-4 sm:flex-row sm:gap-6'>
            <ChannelList
              channels={community.subGroups}
              selectedId={channel.id}
              onSelect={selectChannel}
              className='hidden sm:flex'
            />
            <ChannelSelect
              channels={community.subGroups}
              selectedId={channel.id}
              onSelect={selectChannel}
              className='sm:hidden'
            />
            <ChannelThread
              key={channel.id}
              communityId={community.id}
              channel={channel}
            />
          </section>
        )}
      </Main>
    </>
  )
}

function CommunityError({ error }: { error: Error }) {
  const status =
    error instanceof AxiosError ? error.response?.status : undefined
  const message =
    status === 403
      ? "Vous n'êtes pas membre de cette communauté. Rejoignez-la pour accéder à ses échanges."
      : status === 404
        ? 'Cette communauté est introuvable.'
        : 'Impossible de charger la communauté. Réessayez plus tard.'

  return (
    <div className='space-y-3'>
      <p className='text-destructive'>{message}</p>
      <Button asChild variant='outline'>
        <Link to='/communities'>Retour aux communautés</Link>
      </Button>
    </div>
  )
}
