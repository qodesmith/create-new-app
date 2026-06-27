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
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {useMutationWithToast} from '@/client/hooks/useMutationWithToast'
import {authClientAtom} from '@/client/state/globalState'

import {useQuery} from '@tanstack/react-query'
import {useRouteContext} from '@tanstack/react-router'
import {useAtomValue} from 'jotai'
import {Fingerprint, KeyRound, Plus, Trash2} from 'lucide-react'
import {useMemo, useState} from 'react'

type Passkey = AuthSchemaInsert['passkeys']

export function Passkeys() {
  const authClient = useAtomValue(authClientAtom)
  const logClientError = useLogClientError()
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
          // Server logs this as betterAuth:passkeyList:rejection.
          isRejection = true
          throw error
        }

        return data ?? []
      } catch (error) {
        if (!isRejection) {
          logClientError({error, context: 'client:passkeyList:exception'})
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

  /**
   * Triggers the browser's native WebAuthn dialog (e.g. "Use your
   * fingerprint/security key"). If the user cancels that prompt, the browser
   * throws a `NotAllowedError` DOMException, which `suppress` swallows silently.
   */
  const {run: addPasskey, isPending: isAdding} = useMutationWithToast(
    (name: string) => authClient.passkey.addPasskey({name}),
    {
      success: 'Passkey added',
      invalidate: passkeysQueryKey,
      context: 'client:passkeyAdd:exception',
      errorFallback: 'Failed to add passkey',
      errorMessage: 'static',
      suppress: error =>
        error instanceof DOMException && error.name === 'NotAllowedError',
      onSuccess: () => setAddName(''),
    }
  )

  const {run: deletePasskey, isPending: isDeleting} = useMutationWithToast(
    (id: string) => authClient.passkey.deletePasskey({id}),
    {
      success: 'Passkey deleted',
      invalidate: passkeysQueryKey,
      context: 'client:passkeyDelete:exception',
      errorFallback: 'Failed to delete passkey',
      errorMessage: 'static',
      onSuccess: () => setDeleteTarget(null),
    }
  )

  const handleAdd = () => {
    const name = addName.trim() || `Passkey ${passkeys.length + 1}`
    void addPasskey(name)
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
          disabled={isAdding}
        />
        <Button type="button" onClick={handleAdd} disabled={isAdding}>
          <Plus className="mr-1 size-4" />
          {isAdding ? 'Adding...' : 'Add'}
        </Button>
      </div>

      {/* Passkey list */}
      {passkeys.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Fingerprint className="size-8 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground text-sm">No passkeys yet.</p>
            <p className="text-muted-foreground text-sm">
              Add one to enable passwordless sign-in.
            </p>
          </div>
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
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTarget) void deletePasskey(deleteTarget.id)
              }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
