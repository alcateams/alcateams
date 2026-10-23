import { type SubGroup } from '@/types/api'
import { Hash, MessagesSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ChannelPickerProps = {
  channels: SubGroup[]
  selectedId: string
  onSelect: (channelId: string) => void
  className?: string
}

function ChannelIcon({ channel }: { channel: SubGroup }) {
  const Icon = channel.kind === 'GENERAL' ? MessagesSquare : Hash
  return <Icon className='size-4 shrink-0 text-muted-foreground' />
}

/** The community's channels: the general channel first, then its sub-groups. */
export function ChannelList({
  channels,
  selectedId,
  onSelect,
  className,
}: ChannelPickerProps) {
  return (
    <nav
      aria-label='Canaux de la communauté'
      className={cn('w-56 flex-none flex-col gap-1 lg:w-64', className)}
    >
      <h3 className='px-2 pb-1 text-sm font-medium text-muted-foreground'>
        Canaux
      </h3>
      {channels.map((channel) => (
        <button
          key={channel.id}
          type='button'
          onClick={() => onSelect(channel.id)}
          aria-current={channel.id === selectedId ? 'page' : undefined}
          className={cn(
            'flex w-full items-start gap-2 rounded-md px-2 py-2 text-start text-sm hover:bg-accent hover:text-accent-foreground',
            channel.id === selectedId && 'bg-muted font-medium'
          )}
        >
          <span className='pt-0.5'>
            <ChannelIcon channel={channel} />
          </span>
          <span className='min-w-0'>
            <span className='block truncate'>{channel.name}</span>
            <span className='block truncate text-xs font-normal text-muted-foreground'>
              {channel.theme}
            </span>
          </span>
        </button>
      ))}
    </nav>
  )
}

/** Compact channel picker for small screens. */
export function ChannelSelect({
  channels,
  selectedId,
  onSelect,
  className,
}: ChannelPickerProps) {
  return (
    <Select value={selectedId} onValueChange={onSelect}>
      <SelectTrigger className={cn('w-full', className)} aria-label='Canal'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {channels.map((channel) => (
          <SelectItem key={channel.id} value={channel.id}>
            <ChannelIcon channel={channel} /> {channel.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
