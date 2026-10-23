import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '../api/get-notifications'
import { ROLE_LABELS } from '../role-labels'

export function CommunityNotifications() {
  const { data: notifications } = useNotifications()
  const items = notifications ?? []
  const unread = items.filter((notification) => !notification.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='size-5' />
          {unread > 0 && (
            <Badge
              variant='destructive'
              className='absolute -end-1 -top-1 size-4 justify-center rounded-full p-0 text-[10px]'
            >
              {unread > 9 ? '9+' : unread}
            </Badge>
          )}
          <span className='sr-only'>Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-80'>
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className='px-2 py-4 text-center text-sm text-muted-foreground'>
            Aucune notification.
          </p>
        ) : (
          <ul className='max-h-80 overflow-auto'>
            {items.map((notification) => (
              <li
                key={notification.id}
                className='px-2 py-2 text-sm hover:bg-accent'
              >
                Vous êtes maintenant{' '}
                <span className='font-medium'>
                  {ROLE_LABELS[notification.role].toLowerCase()}
                </span>{' '}
                de « {notification.communityName} ».
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
