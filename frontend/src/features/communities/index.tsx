import { useState } from 'react'
import { Plus, Search as SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { CommunitiesList } from './components/communities-list'
import { CommunityCreateDialog } from './components/community-create-dialog'
import { CommunityJoinDialog } from './components/community-join-dialog'

export function Communities() {
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

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
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Communautés</h2>
            <p className='text-muted-foreground'>
              Créez et retrouvez les communautés dont vous faites partie.
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' onClick={() => setJoinOpen(true)}>
              <SearchIcon /> Rejoindre une communauté
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Créer une communauté
            </Button>
          </div>
        </div>
        <CommunitiesList />
      </Main>

      <CommunityCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CommunityJoinDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  )
}
