import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { type SubGroup } from '@/types/api'
import { Search as SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Scope = 'community' | 'channel'

type CommunitySearchFormProps = {
  communityId: string
  channel: SubGroup
  className?: string
}

/** Searches the community's messages, or only the open channel's, on the search page. */
export function CommunitySearchForm({
  communityId,
  channel,
  className,
}: CommunitySearchFormProps) {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [scope, setScope] = useState<Scope>('community')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const q = text.trim()
    if (!q) return
    navigate({
      to: '/search',
      search: {
        q,
        community: communityId,
        channel: scope === 'channel' ? channel.id : undefined,
      },
    })
  }

  return (
    <form
      role='search'
      onSubmit={submit}
      className={cn('flex w-full gap-2 sm:w-auto', className)}
    >
      <div className='relative min-w-0 flex-1 sm:w-56 sm:flex-none'>
        <SearchIcon
          aria-hidden='true'
          className='absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
        />
        <Input
          type='search'
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder='Rechercher…'
          aria-label='Rechercher dans les messages'
          maxLength={200}
          className='ps-9'
        />
      </div>
      <Select value={scope} onValueChange={(value) => setScope(value as Scope)}>
        <SelectTrigger className='w-36 flex-none' aria-label='Où rechercher'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='community'>Communauté</SelectItem>
          <SelectItem value='channel'># {channel.name}</SelectItem>
        </SelectContent>
      </Select>
    </form>
  )
}
