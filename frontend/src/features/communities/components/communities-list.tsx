import { useState } from 'react'
import { type Community } from '@/types/api'
import { Folder, Hash, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useMyCommunities } from '../api/get-my-communities'
import { CommunityLeaveDialog } from './community-leave-dialog'

export function CommunitiesList() {
  const { data: communities, isLoading, isError } = useMyCommunities()
  const [leaving, setLeaving] = useState<Community | null>(null)

  if (isLoading) {
    return <p className='text-muted-foreground'>Chargement des communautés…</p>
  }

  if (isError) {
    return (
      <p className='text-destructive'>
        Impossible de charger vos communautés. Réessayez plus tard.
      </p>
    )
  }

  if (!communities || communities.length === 0) {
    return (
      <p className='text-muted-foreground'>
        Vous n'avez pas encore de communauté. Créez-en une pour commencer.
      </p>
    )
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {communities.map((community) => (
        <Card key={community.id}>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Folder className='size-4' /> {community.name}
            </CardTitle>
            <CardDescription>{community.description}</CardDescription>
            <CardAction>
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground hover:text-destructive'
                onClick={() => setLeaving(community)}
              >
                <LogOut /> Quitter
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {/* Arborescence: the community's sub-groups shown as child nodes. */}
            <ul className='ms-2 border-s ps-4'>
              {community.subGroups.map((subGroup) => (
                <li
                  key={subGroup.id}
                  className='flex items-center gap-2 py-1 text-sm'
                >
                  <Hash className='size-3.5 text-muted-foreground' />
                  <span className='font-medium'>{subGroup.name}</span>
                  <span className='text-muted-foreground'>
                    · {subGroup.theme}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <CommunityLeaveDialog
        community={leaving}
        onOpenChange={(open) => {
          if (!open) setLeaving(null)
        }}
      />
    </div>
  )
}
