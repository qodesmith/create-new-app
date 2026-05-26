import {Button} from '@/client/components/ui/button'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {authClientAtom} from '@/client/state/globalState'

import {useNavigate, useRouter} from '@tanstack/react-router'
import {useAtomValue} from 'jotai'
import {useState} from 'react'
import {toast} from 'sonner'

export function ImpersonationBanner() {
  const authClient = useAtomValue(authClientAtom)
  const session = authClient.useSession()
  const router = useRouter()
  const navigate = useNavigate()
  const logClientError = useLogClientError()
  const [isStopping, setIsStopping] = useState(false)

  const data = session.data
  if (!data?.session.impersonatedBy) return null

  async function handleStop() {
    setIsStopping(true)
    try {
      const {error} = await authClient.admin.stopImpersonating()

      if (error) {
        toast.error(error.message ?? 'Failed to stop impersonating')
        return
      }

      await router.invalidate()
      await navigate({to: '/admin'})
    } catch (error) {
      toast.error('An unexpected error occurred while stopping impersonation')
      logClientError({
        error,
        context: 'client:adminStopImpersonating:exception',
      })
    } finally {
      setIsStopping(false)
    }
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-amber-700 border-b bg-amber-400 px-4 py-2 text-amber-950 dark:bg-amber-500">
      <span className="font-medium text-sm">
        Impersonating <strong>{data.user.email}</strong>
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={handleStop}
        disabled={isStopping}
        className="border-amber-900 bg-amber-100 text-amber-950 hover:bg-amber-200 hover:text-amber-950"
      >
        {isStopping ? 'Stopping…' : 'Stop impersonating'}
      </Button>
    </div>
  )
}
