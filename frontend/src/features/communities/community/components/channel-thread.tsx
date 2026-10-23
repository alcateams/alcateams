import { type SubGroup } from '@/types/api'
import { Hash, MessagesSquare } from 'lucide-react'
import { handleServerError } from '@/lib/handle-server-error'
import { useCurrentUser } from '@/features/auth/api/current-user'
import { useChannelMessages, useSendMessage } from '../../api/channel-messages'
import { MessageComposer } from './message-composer'
import { MessageList } from './message-list'

type ChannelThreadProps = {
  communityId: string
  channel: SubGroup
}

export function ChannelThread({ communityId, channel }: ChannelThreadProps) {
  const { data: currentUser } = useCurrentUser()
  const messages = useChannelMessages(communityId, channel.id)
  const sendMessage = useSendMessage(communityId, channel.id, currentUser)
  const Icon = channel.kind === 'GENERAL' ? MessagesSquare : Hash

  // mutateAsync settles per call, unlike mutate()'s per-call callbacks, which only fire for the
  // latest send.
  const handleSend = async (text: string, restore: () => void) => {
    try {
      await sendMessage.mutateAsync({ text })
    } catch (error) {
      handleServerError(error)
      restore()
    }
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col rounded-md border bg-background shadow-xs'>
      <div className='flex flex-none items-center gap-2 border-b bg-card p-4 sm:rounded-t-md'>
        <Icon className='size-5 text-muted-foreground' />
        <div className='min-w-0'>
          <h3 className='truncate font-medium'>{channel.name}</h3>
          <p className='truncate text-xs text-muted-foreground'>
            {channel.theme}
          </p>
        </div>
      </div>

      <MessageList
        query={messages}
        currentUserId={currentUser?.id}
        className='min-h-0 flex-1'
      />

      <MessageComposer
        channelName={channel.name}
        onSend={handleSend}
        className='flex-none p-4 pt-2'
      />
    </div>
  )
}
