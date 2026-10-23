import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { MessageSearch } from '@/features/search'

const messageSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  // Scope: a community, then optionally one of its channels. All communities otherwise.
  community: z.string().optional().catch(undefined),
  channel: z.string().optional().catch(undefined),
  sort: z.enum(['relevance', 'recent']).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/search/')({
  validateSearch: messageSearchSchema,
  component: MessageSearch,
})
