import { AxiosError } from 'axios'
import { type Community } from '@/types/api'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useLeaveCommunity } from '../api/leave-community'

type CommunityLeaveDialogProps = {
  community: Community | null
  onOpenChange: (open: boolean) => void
}

export function CommunityLeaveDialog({
  community,
  onOpenChange,
}: CommunityLeaveDialogProps) {
  const leaveCommunity = useLeaveCommunity()
  const blockingError = getBlockingError(leaveCommunity.error)

  const handleOpenChange = (open: boolean) => {
    // Clear a previous refusal so it doesn't show up when leaving another community.
    if (!open) leaveCommunity.reset()
    onOpenChange(open)
  }

  const handleConfirm = () => {
    if (!community) return
    leaveCommunity.mutate(community.id, {
      onSuccess: () => {
        toast.success(`Vous avez quitté « ${community.name} »`)
        handleOpenChange(false)
      },
      onError: (error) => {
        // Blocking errors are shown inside the dialog instead of a toast.
        if (!getBlockingError(error)) handleServerError(error)
      },
    })
  }

  return (
    <ConfirmDialog
      open={community !== null}
      onOpenChange={handleOpenChange}
      title='Quitter la communauté'
      desc={
        <>
          Voulez-vous vraiment quitter « {community?.name} » ? Vous n'aurez plus
          accès à ses échanges, sauf si vous la rejoignez à nouveau.
        </>
      }
      cancelBtnText={blockingError ? 'Fermer' : 'Annuler'}
      confirmText='Quitter'
      destructive
      disabled={blockingError !== null}
      isLoading={leaveCommunity.isPending}
      handleConfirm={handleConfirm}
    >
      {blockingError && (
        <Alert variant='destructive'>
          <AlertTriangle />
          <AlertTitle>Impossible de quitter cette communauté</AlertTitle>
          <AlertDescription>{blockingError}</AlertDescription>
        </Alert>
      )}
    </ConfirmDialog>
  )
}

/**
 * A 409 means a business rule refuses the departure (e.g. the user is the last moderator):
 * retrying won't help, so the server's message is shown prominently in the dialog.
 */
function getBlockingError(error: unknown): string | null {
  if (error instanceof AxiosError && error.response?.status === 409) {
    const message = error.response.data?.error
    return typeof message === 'string' ? message : null
  }
  return null
}
