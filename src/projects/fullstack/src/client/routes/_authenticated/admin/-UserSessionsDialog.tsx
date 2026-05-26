import type {TableUser} from './-usersTableColumns'

import {AudioLoader} from '@/client/components/custom/AudioLoader'
import {ConfirmDialog} from '@/client/components/custom/ConfirmDialog'
import {LoadingButton} from '@/client/components/custom/LoadingButton'
import {Badge} from '@/client/components/ui/badge'
import {Button} from '@/client/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/client/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/client/components/ui/table'
import {useBoolean} from '@/client/hooks/useBoolean'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {authClientAtom} from '@/client/state/globalState'
import {parseUserAgent} from '@/client/utils/parseUserAgent'

import {useQuery, useQueryClient} from '@tanstack/react-query'
import {useAtomValue} from 'jotai'
import {useState} from 'react'
import {toast} from 'sonner'

type UserSessionsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: TableUser | null
}

export function UserSessionsDialog({
  open,
  onOpenChange,
  user,
}: UserSessionsDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Sessions for {user.email}</DialogTitle>
          <DialogDescription>
            Revoke individual devices or sign this user out everywhere. Revoking
            an impersonation session here signs the impersonator out entirely —
            use the impersonation banner's <strong>Stop impersonating</strong>{' '}
            button to return to your admin account.
          </DialogDescription>
        </DialogHeader>
        <UserSessionsDialogBody
          key={user.id}
          user={user}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

type UserSessionsDialogBodyProps = {
  user: TableUser
  onClose: () => void
}

function UserSessionsDialogBody({user, onClose}: UserSessionsDialogBodyProps) {
  const authClient = useAtomValue(authClientAtom)
  const currentSession = authClient.useSession()
  const currentSessionToken = currentSession.data?.session.token
  const logClientError = useLogClientError()
  const queryClient = useQueryClient()
  const revokeAllDialog = useBoolean()
  const [revokingTokens, setRevokingTokens] = useState<Set<string>>(new Set())
  const [isRevokingAll, setIsRevokingAll] = useState(false)

  const sessionsQueryKey = ['admin', 'users', user.id, 'sessions'] as const

  const sessionsQuery = useQuery({
    queryKey: sessionsQueryKey,
    queryFn: async () => {
      const {data, error} = await authClient.admin.listUserSessions({
        userId: user.id,
      })

      if (error) {
        throw new Error(error.message ?? 'Failed to load sessions')
      }

      return data?.sessions ?? []
    },
  })

  async function handleRevoke(sessionToken: string) {
    setRevokingTokens(prev => {
      const next = new Set(prev)
      next.add(sessionToken)
      return next
    })

    try {
      const {error} = await authClient.admin.revokeUserSession({sessionToken})

      if (error) {
        toast.error(error.message ?? 'Failed to revoke session')
        return
      }

      toast.success('Session revoked')
      await queryClient.invalidateQueries({queryKey: sessionsQueryKey})
    } catch (error) {
      toast.error('An unexpected error occurred while revoking the session')
      logClientError({
        error,
        context: 'client:adminRevokeUserSession:exception',
      })
    } finally {
      setRevokingTokens(prev => {
        const next = new Set(prev)
        next.delete(sessionToken)
        return next
      })
    }
  }

  async function handleRevokeAll() {
    setIsRevokingAll(true)
    try {
      const {error} = await authClient.admin.revokeUserSessions({
        userId: user.id,
      })

      if (error) {
        toast.error(error.message ?? 'Failed to revoke sessions')
        return
      }

      toast.success(`All sessions revoked for ${user.email}`)
      await Promise.all([
        queryClient.invalidateQueries({queryKey: sessionsQueryKey}),
        queryClient.invalidateQueries({queryKey: ['admin', 'users']}),
      ])
      revokeAllDialog.setFalse()
      onClose()
    } catch (error) {
      toast.error('An unexpected error occurred while revoking sessions')
      logClientError({
        error,
        context: 'client:adminRevokeUserSessions:exception',
      })
    } finally {
      setIsRevokingAll(false)
    }
  }

  const sessions = sessionsQuery.data ?? []
  const hasSessions = sessions.length > 0

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionsQuery.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <AudioLoader width={14} height={14} bars={3} gap={1} />
                    Loading sessions…
                  </span>
                </TableCell>
              </TableRow>
            ) : sessionsQuery.error ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-destructive"
                >
                  {sessionsQuery.error.message || 'Failed to load sessions'}
                </TableCell>
              </TableRow>
            ) : hasSessions ? (
              sessions.map(session => {
                const ua = parseUserAgent(session.userAgent)
                const isImpersonation = Boolean(session.impersonatedBy)
                const isCurrent =
                  !!currentSessionToken && session.token === currentSessionToken
                const isRevoking = revokingTokens.has(session.token)

                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{ua.browser}</span>
                        <span className="text-muted-foreground text-xs">
                          {ua.os} · {ua.device}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {session.ipAddress || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatSessionDate(session.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatSessionDate(session.expiresAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {isImpersonation ? (
                          <Badge
                            variant="secondary"
                            className="bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          >
                            Impersonation
                          </Badge>
                        ) : null}
                        {isCurrent ? (
                          <Badge variant="outline">This session</Badge>
                        ) : null}
                        {isImpersonation || isCurrent ? null : (
                          <span className="text-muted-foreground text-sm">
                            Active
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <LoadingButton
                        size="sm"
                        variant={isCurrent ? 'outline' : 'destructive'}
                        loading={isRevoking}
                        onClick={() => handleRevoke(session.token)}
                        title={
                          isCurrent
                            ? 'Revoking your current session will sign you out immediately'
                            : undefined
                        }
                      >
                        {isRevoking ? 'Revoking…' : 'Revoke'}
                      </LoadingButton>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No active sessions.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isRevokingAll}
        >
          Close
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={revokeAllDialog.setTrue}
          disabled={!hasSessions || isRevokingAll}
        >
          Revoke all sessions
        </Button>
      </DialogFooter>

      <ConfirmDialog
        open={revokeAllDialog.value}
        onOpenChange={revokeAllDialog.setValue}
        title={`Revoke all sessions for ${user.email}?`}
        description="They will be signed out from every device. They can sign in again immediately."
        confirmLabel="Revoke all"
        variant="destructive"
        isPending={isRevokingAll}
        onConfirm={handleRevokeAll}
      />
    </>
  )
}

function formatSessionDate(value: Date | string | null | undefined) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}
