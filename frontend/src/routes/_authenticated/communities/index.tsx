import { createFileRoute } from '@tanstack/react-router'
import { Communities } from '@/features/communities'

export const Route = createFileRoute('/_authenticated/communities/')({
  component: Communities,
})
