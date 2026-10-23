import { type CommunityRole } from '@/types/api'

export const ROLE_LABELS: Record<CommunityRole, string> = {
  MODERATOR: 'Modérateur',
  COMODERATOR: 'Co-modérateur',
  MEMBER: 'Membre',
}

export const ASSIGNABLE_ROLES: CommunityRole[] = [
  'MODERATOR',
  'COMODERATOR',
  'MEMBER',
]

export function roleBadgeVariant(
  role: CommunityRole
): 'default' | 'secondary' | 'outline' {
  if (role === 'MODERATOR') return 'default'
  if (role === 'COMODERATOR') return 'secondary'
  return 'outline'
}
