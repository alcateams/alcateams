import { useEffect, useState } from 'react'
import { Check, Hash, Search as SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import { type Community } from '@/types/api'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useMyCommunities } from '../api/get-my-communities'
import { useJoinCommunity } from '../api/join-community'
import { MIN_SEARCH_LENGTH, useSearchCommunities } from '../api/search-communities'

type CommunityJoinDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Small debounce so we don't fire a request on every keystroke.
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

export function CommunityJoinDialog({
  open,
  onOpenChange,
}: CommunityJoinDialogProps) {
  const [term, setTerm] = useState('')
  const debouncedTerm = useDebouncedValue(term, 300)

  const { data: results, isFetching } = useSearchCommunities(debouncedTerm)
  const { data: myCommunities } = useMyCommunities()
  const joinedIds = new Set((myCommunities ?? []).map((community) => community.id))

  const joinCommunity = useJoinCommunity({
    onSuccess: (community) => {
      toast.success(`Vous avez rejoint « ${community.name} »`)
    },
  })

  const handleJoin = (communityId: string) => {
    joinCommunity.mutate(communityId, {
      onError: handleServerError,
    })
  }

  const hasSearched = debouncedTerm.trim().length >= MIN_SEARCH_LENGTH
  const noResults =
    hasSearched && !isFetching && (results?.length ?? 0) === 0

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) setTerm('')
        onOpenChange(state)
      }}
    >
      <DialogContent className='flex max-h-[90vh] flex-col sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <SearchIcon /> Rejoindre une communauté
          </DialogTitle>
          <DialogDescription>
            Recherchez une communauté par son nom, puis rejoignez-la pour
            accéder à ses échanges.
          </DialogDescription>
        </DialogHeader>

        <Input
          autoFocus
          placeholder='Rechercher une communauté…'
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />

        <div className='flex-1 space-y-2 overflow-y-auto px-1'>
          {!hasSearched && (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              Saisissez au moins {MIN_SEARCH_LENGTH} caractères pour lancer la
              recherche.
            </p>
          )}

          {noResults && (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              Aucun résultat.
            </p>
          )}

          {hasSearched &&
            results?.map((community) => (
              <CommunityResult
                key={community.id}
                community={community}
                isMember={joinedIds.has(community.id)}
                isJoining={
                  joinCommunity.isPending &&
                  joinCommunity.variables === community.id
                }
                onJoin={() => handleJoin(community.id)}
              />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

type CommunityResultProps = {
  community: Community
  isMember: boolean
  isJoining: boolean
  onJoin: () => void
}

function CommunityResult({
  community,
  isMember,
  isJoining,
  onJoin,
}: CommunityResultProps) {
  return (
    <div className='flex items-start justify-between gap-3 rounded-md border p-3'>
      <div className='min-w-0'>
        <p className='font-medium'>{community.name}</p>
        <p className='text-muted-foreground truncate text-sm'>
          {community.description}
        </p>
        {community.subGroups.length > 0 && (
          <div className='text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs'>
            {community.subGroups.map((subGroup) => (
              <span key={subGroup.id} className='flex items-center gap-1'>
                <Hash className='size-3' />
                {subGroup.name}
              </span>
            ))}
          </div>
        )}
      </div>
      {isMember ? (
        <Button variant='outline' size='sm' disabled className='shrink-0'>
          <Check /> Déjà membre
        </Button>
      ) : (
        <Button
          size='sm'
          className='shrink-0'
          onClick={onJoin}
          disabled={isJoining}
        >
          Rejoindre
        </Button>
      )}
    </div>
  )
}
