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
import {useBoolean} from '@/client/hooks/useBoolean'
import {logClientError} from '@/client/lib/utils'
import {apiClientAtom, authClientAtom} from '@/client/state/globalState'

import {useAtomValue} from 'jotai'
import {Fingerprint, KeyRound, Plus, Trash2} from 'lucide-react'
import {useCallback, useEffect, useState} from 'react'
import {toast} from 'sonner'

type Passkey = AuthSchemaInsert['passkeys']

export function Passkeys() {
  const authClient = useAtomValue(authClientAtom)
  const apiClient = useAtomValue(apiClientAtom)
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addName, setAddName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // Delete dialog state
  const deleteDialog = useBoolean()
  const [deleteTarget, setDeleteTarget] = useState<Passkey | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchPasskeys = useCallback(async () => {
    try {
      const {data, error} = await authClient.passkey.listUserPasskeys()

      if (error) {
        logClientError({
          error,
          context: 'client:passkeyListRejection',
          apiClient,
        })
        return
      }

      setPasskeys(data ?? [])
    } catch (error) {
      logClientError({error, context: 'client:passkeyListException', apiClient})
    } finally {
      setIsLoading(false)
    }
  }, [authClient, apiClient])

  useEffect(() => {
    void fetchPasskeys()
  }, [fetchPasskeys])

  const handleAdd = async () => {
    setIsAdding(true)

    try {
      const name = addName.trim() || `Passkey ${passkeys.length + 1}`
      /**
       * Triggers the browser's native WebAuthn dialog (e.g. "Use your
       * fingerprint/security key"). If the user cancels that prompt, the
       * browser throws a `NotAllowedError` DOMException caught below.
       */
      const {error} = await authClient.passkey.addPasskey({name})

      if (error) {
        toast.error(error.message || 'Failed to add passkey')
        logClientError({
          error,
          context: 'client:passkeyAddRejection',
          apiClient,
        })
        return
      }

      toast.success('Passkey added')
      setAddName('')
      return fetchPasskeys()
    } catch (error) {
      /**
       * Detects when the user cancelled the browser's native WebAuthn prompt.
       *
       * Flow:
       * 1. User clicks "Add Passkey" button
       * 2. `authClient.passkey.addPasskey()` triggers the browser's native WebAuthn
       *    prompt (fingerprint/security key)
       * 3. User dismisses/cancels that prompt
       * 4. Browser throws a `NotAllowedError` DOMException
       * 5. Catch block silently swallows it (no error toast, since it's intentional)
       */
      const isWebAuthnCancellation =
        error instanceof DOMException && error.name === 'NotAllowedError'
      if (isWebAuthnCancellation) return

      toast.error('Failed to add passkey')
      logClientError({error, context: 'client:passkeyAddException', apiClient})
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const {error} = await authClient.passkey.deletePasskey({
        id: deleteTarget.id,
      })

      if (error) {
        toast.error(error.message || 'Failed to delete passkey')
        logClientError({
          error,
          context: 'client:passkeyDeleteRejection',
          apiClient,
        })
        return
      }

      toast.success('Passkey deleted')
      deleteDialog.setFalse()
      setDeleteTarget(null)
      return fetchPasskeys()
    } catch (error) {
      toast.error('Failed to delete passkey')
      logClientError({
        error,
        context: 'client:passkeyDeleteException',
        apiClient,
      })
    } finally {
      setIsDeleting(false)
    }
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
              void handleAdd()
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
                onClick={() => {
                  setDeleteTarget(passkey)
                  deleteDialog.setTrue()
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialog.value}
        onOpenChange={open => {
          if (!open) {
            deleteDialog.setFalse()
            setDeleteTarget(null)
          }
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
              onClick={() => {
                deleteDialog.setFalse()
                setDeleteTarget(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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
