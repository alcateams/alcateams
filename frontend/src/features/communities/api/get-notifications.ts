import { useQuery } from '@tanstack/react-query'
import { type Notification } from '@/types/api'
import { api } from '@/lib/api-client'

export const notificationsQueryKey = ['notifications']

const getNotifications = (): Promise<Notification[]> => {
  return api.get('/api/notifications')
}

export const useNotifications = () => {
  return useQuery({
    queryKey: notificationsQueryKey,
    queryFn: getNotifications,
  })
}
