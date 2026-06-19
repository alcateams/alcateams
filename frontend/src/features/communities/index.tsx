import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { CommunitiesList } from './components/communities-list'
import { CommunityCreateDialog } from './components/community-create-dialog'

export function Communities() {
  const [createOpen, setCreateOpen] = useState(false)

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
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Créer une communauté
          </Button>
        </div>
        <CommunitiesList />
      </Main>

      <CommunityCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
