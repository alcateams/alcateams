import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Folder, Hash, MessagesSquare, Users } from 'lucide-react'
import { type Community } from '@/types/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useMyCommunities } from '../api/get-my-communities'
import { CommunityMembersSheet } from './community-members-sheet'

// A community's moderators (MODERATOR, COMODERATOR) may see its member list.
function canSeeMembers(community: Community): boolean {
  return community.myRole === 'MODERATOR' || community.myRole === 'COMODERATOR'
}

export function CommunitiesList() {
  const { data: communities, isLoading, isError } = useMyCommunities()
  const [managed, setManaged] = useState<Community | null>(null)

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
    <>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {communities.map((community) => (
          <Card key={community.id}>
            <CardHeader>
              <CardTitle>
                <Link
                  to='/communities/$communityId'
                  params={{ communityId: community.id }}
                  className='flex items-center gap-2 hover:underline'
                >
                  <Folder className='size-4' /> {community.name}
                </Link>
              </CardTitle>
              <CardDescription>{community.description}</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-4'>
              {/* Arborescence: the community's sub-groups shown as child nodes. */}
              <ul className='ms-2 border-s ps-4'>
                {community.subGroups.map((subGroup) => {
                  const Icon =
                    subGroup.kind === 'GENERAL' ? MessagesSquare : Hash
                  return (
                    <li key={subGroup.id}>
                      <Link
                        to='/communities/$communityId'
                        params={{ communityId: community.id }}
                        search={{ channel: subGroup.id }}
                        className='flex items-center gap-2 rounded-sm py-1 text-sm hover:bg-accent'
                      >
                        <Icon className='size-3.5 text-muted-foreground' />
                        <span className='font-medium'>{subGroup.name}</span>
                        <span className='text-muted-foreground'>
                          · {subGroup.theme}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              {canSeeMembers(community) && (
                <Button
                  variant='outline'
                  size='sm'
                  className='self-start'
                  onClick={() => setManaged(community)}
                >
                  <Users className='size-4' /> Gérer les membres
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {managed && (
        <CommunityMembersSheet
          communityId={managed.id}
          communityName={managed.name}
          canManage={managed.myRole === 'MODERATOR'}
          open={managed !== null}
          onOpenChange={(open) => {
            if (!open) setManaged(null)
          }}
        />
      )}
    </>
  )
}
