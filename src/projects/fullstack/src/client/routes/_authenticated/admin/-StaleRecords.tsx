import {ConfirmDialog} from '@/client/components/custom/ConfirmDialog'
import {LoadingButton} from '@/client/components/custom/LoadingButton'
import {useLogClientError} from '@/client/hooks/useLogClientError'
import {apiAdminClientAtom} from '@/client/state/globalState'

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {DetailedError, parseResponse} from 'hono/client'
import {useAtomValue} from 'jotai'
import {useState} from 'react'
import {toast} from 'sonner'

const staleRecordsQueryKey = ['admin', 'stale-records'] as const

export function StaleRecords() {
  const adminClient = useAtomValue(apiAdminClientAtom)
  const queryClient = useQueryClient()
  const logClientError = useLogClientError()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const staleRecordsQuery = useQuery({
    queryKey: staleRecordsQueryKey,
    queryFn: () => parseResponse(adminClient['stale-records'].$get()),
  })

  const purgeMutation = useMutation({
    mutationFn: () => parseResponse(adminClient['stale-records'].$delete()),
    onSuccess: () => {
      toast.success('Purged stale records')
      setConfirmOpen(false)
      void queryClient.invalidateQueries({queryKey: staleRecordsQueryKey})
    },
    onError: error => {
      toast.error('Failed to purge stale records')
      setConfirmOpen(false)

      if (!(error instanceof DetailedError)) {
        logClientError({error, context: 'client:adminPurge:exception'})
      }
    },
  })

  const stale = staleRecordsQuery.data
  const hasStale = stale
    ? stale.staleUsers.length +
        stale.staleVerifications.length +
        stale.staleRatelimits.length >
      0
    : false

  return (
    <>
      {staleRecordsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">…</p>
      ) : stale ? (
        <div className="grid grid-cols-[auto_1fr] justify-start gap-x-3 text-muted-foreground text-sm">
          <div>Unverified stale users:</div>
          <div>{stale.staleUsers.length}</div>
          <div>Expired verifications:</div>
          <div>{stale.staleVerifications.length}</div>
          <div>Stale rate-limits:</div>
          <div>{stale.staleRatelimits.length}</div>
        </div>
      ) : null}
      <LoadingButton disabled={!hasStale} onClick={() => setConfirmOpen(true)}>
        Purge stale records
      </LoadingButton>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Purge stale records?"
        description="This permanently deletes unverified stale users, expired verifications, and stale rate-limits. This action cannot be undone."
        confirmLabel="Purge"
        variant="destructive"
        isPending={purgeMutation.isPending}
        onConfirm={() => purgeMutation.mutate()}
      />
    </>
  )
}
