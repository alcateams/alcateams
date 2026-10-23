import { type FormEvent, type KeyboardEvent, useState } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

// Mirrors the API's limit.
const MAX_MESSAGE_LENGTH = 4000

type MessageComposerProps = {
  channelName: string
  /** `restore` puts the text back in the composer, e.g. when sending fails. */
  onSend: (text: string, restore: () => void) => void
  className?: string
}

export function MessageComposer({
  channelName,
  onSend,
  className,
}: MessageComposerProps) {
  const [text, setText] = useState('')
  const canSend = text.trim().length > 0

  const submit = () => {
    if (!canSend) return
    const sent = text.trim()
    setText('')
    onSend(sent, () => setText(sent))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit()
  }

  // Enter sends; Shift+Enter inserts a line break. Ignore Enter while an IME is composing.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex items-end gap-2', className)}
    >
      <label className='flex-1'>
        <span className='sr-only'>Message</span>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Écrire dans ${channelName}…`}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={1}
          className='max-h-40 min-h-10 resize-none'
        />
      </label>
      <Button
        type='submit'
        size='icon'
        disabled={!canSend}
        aria-label='Envoyer'
      >
        <Send />
      </Button>
    </form>
  )
}
