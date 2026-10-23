import { type CommunityMember, type CommunityRole } from '@/types/api'
import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCurrentUser } from '@/features/auth/api/current-user'
import { useChangeMemberRole } from '../api/change-member-role'
import { useCommunityMembers } from '../api/get-community-members'
import { ASSIGNABLE_ROLES, ROLE_LABELS, roleBadgeVariant } from '../role-labels'

type CommunityMembersSheetProps = {
  communityId: string
  communityName: string
  /** Whether the current user may assign roles (only a MODERATOR can). */
  canManage: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommunityMembersSheet({
  communityId,
  communityName,
  canManage,
  open,
  onOpenChange,
}: CommunityMembersSheetProps) {
  const {
    data: members,
    isLoading,
    isError,
  } = useCommunityMembers(communityId, open)
  const { data: currentUser } = useCurrentUser()
  const changeRole = useChangeMemberRole(communityId)

  const handleRoleChange = (member: CommunityMember, role: CommunityRole) => {
    if (role === member.role) return
    changeRole.mutate(
      { communityId, userId: member.userId, role },
      {
        onSuccess: () => {
          toast.success(
            `${member.pseudo} est maintenant ${ROLE_LABELS[role].toLowerCase()}`
          )
        },
        onError: handleServerError,
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col gap-4 sm:max-w-xl'>
        <SheetHeader>
          <SheetTitle>Membres de « {communityName} »</SheetTitle>
          <SheetDescription>
            {canManage
              ? 'Gérez les rôles des membres de votre communauté.'
              : 'Liste des membres de la communauté.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto px-4'>
          {isLoading && (
            <p className='text-muted-foreground'>Chargement des membres…</p>
          )}
          {isError && (
            <p className='text-destructive'>
              Impossible de charger les membres. Réessayez plus tard.
            </p>
          )}
          {members && members.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pseudo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  {canManage && <TableHead className='w-10' />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isSelf = member.userId === currentUser?.id
                  return (
                    <TableRow key={member.userId}>
                      <TableCell className='font-medium'>
                        {member.pseudo}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(member.role)}>
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          {/* A moderator cannot change their own role (enforced server-side too). */}
                          {!isSelf && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  disabled={changeRole.isPending}
                                >
                                  <MoreHorizontal className='size-4' />
                                  <span className='sr-only'>
                                    Changer le rôle de {member.pseudo}
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuLabel>
                                  Changer le rôle
                                </DropdownMenuLabel>
                                <DropdownMenuRadioGroup
                                  value={member.role}
                                  onValueChange={(value) =>
                                    handleRoleChange(
                                      member,
                                      value as CommunityRole
                                    )
                                  }
                                >
                                  {ASSIGNABLE_ROLES.map((role) => (
                                    <DropdownMenuRadioItem
                                      key={role}
                                      value={role}
                                    >
                                      {ROLE_LABELS[role]}
                                    </DropdownMenuRadioItem>
                                  ))}
                                </DropdownMenuRadioGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {members && members.length === 0 && (
            <p className='text-muted-foreground'>
              Aucun membre pour l'instant.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
