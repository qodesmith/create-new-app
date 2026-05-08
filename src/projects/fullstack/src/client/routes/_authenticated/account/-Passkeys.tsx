import type {AuthSchemaInsert} from '@/shared/types'

import {Button} from '@/client/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/client/components/ui/dialog'
import {Input} from '@/client/components/ui/input'
import {useCaptureError} from '@/client/hooks/useCaptureError'
import {authClientAtom} from '@/client/state/globalState'

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {useRouteContext} from '@tanstack/react-router'
import {useAtomValue} from 'jotai'
import {Fingerprint, KeyRound, Plus, Trash2} from 'lucide-react'
import {useMemo, useState} from 'react'
import {toast} from 'sonner'

type Passkey = AuthSchemaInsert['passkeys']

export function Passkeys() {
  const authClient = useAtomValue(authClientAtom)
  const captureError = useCaptureError()
  const queryClient = useQueryClient()
  const [addName, setAddName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Passkey | null>(null)
  const user = useRouteContext({
    from: '/_authenticated',
    select: ({user}) => user,
  })
  const passkeysQueryKey = useMemo(() => {
    return ['passkeys', user.id] as const
  }, [user.id])

  const {data: passkeys = [], isLoading} = useQuery<Passkey[]>({
    queryKey: passkeysQueryKey,
    queryFn: async () => {
      let isRejection = false

      try {
        const {data, error} = await authClient.passkey.listUserPasskeys()

        if (error) {
          // Better Auth returned a structured error — not a client exception.
          // Don't capture; rejection-class outcomes are server-owned.
          isRejection = true
          throw error
        }

        return data ?? []
      } catch (error) {
        if (!isRejection) {
          captureError({error, context: 'client:passkeyList:exception'})
        }

        /**
         * Rethrow so react-query flips to error state, retries per the
         * `queryClient` config, and lets `queryCache.onError` route 404s to
         * `notFound()`. Swallowing here would resolve the query as successful
         * with `undefined` data.
         */
        throw error
      }
    },
  })

  const addMutation = useMutation({
    /**
     * Triggers the browser's native WebAuthn dialog (e.g. "Use your
     * fingerprint/security key"). If the user cancels that prompt, the
     * browser throws a `NotAllowedError` DOMException handled in `onError`.
     */
    mutationFn: async (name: string) => authClient.passkey.addPasskey({name}),
    onSuccess: result => {
      if (result?.error) {
        toast.error(result.error.message || 'Failed to add passkey')
        return
      }

      toast.success('Passkey added')
      setAddName('')
      void queryClient.invalidateQueries({queryKey: passkeysQueryKey})
    },
    onError: error => {
      // User dismissed the native WebAuthn prompt — intentional, not a failure.
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        return
      }

      toast.error('Failed to add passkey')
      captureError({error, context: 'client:passkeyAdd:exception'})
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => authClient.passkey.deletePasskey({id}),
    onSuccess: result => {
      if (result?.error) {
        toast.error(result.error.message || 'Failed to delete passkey')
        return
      }

      toast.success('Passkey deleted')
      setDeleteTarget(null)
      void queryClient.invalidateQueries({queryKey: passkeysQueryKey})
    },
    onError: error => {
      toast.error('Failed to delete passkey')
      captureError({error, context: 'client:passkeyDelete:exception'})
    },
  })

  const handleAdd = () => {
    const name = addName.trim() || `Passkey ${passkeys.length + 1}`
    addMutation.mutate(name)
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading passkeys...</p>
  }

  return (
    <div className="space-y-4">
      {/* Add passkey */}
      <div className="flex gap-2">
        <Input
          placeholder="Passkey name (optional)"
          value={addName}
          onChange={e => setAddName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          disabled={addMutation.isPending}
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={addMutation.isPending}
        >
          <Plus className="mr-1 size-4" />
          {addMutation.isPending ? 'Adding...' : 'Add'}
        </Button>
      </div>

      {/* Passkey list */}
      {passkeys.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Fingerprint className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            No passkeys yet. Add one to enable passwordless sign-in.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {passkeys.map(passkey => (
            <li
              key={passkey.id}
              className="flex items-center justify-between gap-2 py-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                <div className="overflow-hidden">
                  <p className="truncate font-medium text-sm">
                    {passkey.name || 'Unnamed passkey'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {passkey.deviceType} &middot; Added{' '}
                    {passkey.createdAt &&
                      new Date(passkey.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(passkey)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete passkey</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              {deleteTarget?.name || 'Unnamed passkey'}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
