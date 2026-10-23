import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { CommunityPage } from '@/features/communities/community'

const communitySearchSchema = z.object({
  // Selected channel (sub-group id); defaults to the general channel.
  channel: z.string().optional().catch(undefined),
})

export const Route = createFileRoute(
  '/_authenticated/communities/$communityId'
)({
  validateSearch: communitySearchSchema,
  component: CommunityPage,
})
