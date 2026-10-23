import { AxiosError } from 'axios'
import { toast } from 'sonner'

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  let errMsg = 'Something went wrong!'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Content not found.'
  }

  if (error instanceof AxiosError) {
    const data = error.response?.data
    errMsg = normalizeServerError(data?.error) ?? data?.title ?? error.message
  }

  toast.error(errMsg)
}

/**
 * The API returns `error` either as a string (domain errors) or as a field→messages
 * map (validation errors). Flatten the map into a readable string so toasts never
 * render "[object Object]".
 */
function normalizeServerError(error: unknown): string | undefined {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const messages = Object.values(error as Record<string, unknown>)
      .flat()
      .filter((message): message is string => typeof message === 'string')
    if (messages.length > 0) return messages.join(' ')
  }
  return undefined
}
