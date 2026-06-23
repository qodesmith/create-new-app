import {AudioLoader} from '@/client/components/custom/AudioLoader'
import {SonarPulse} from '@/client/components/custom/SonarPulse'
import {Button} from '@/client/components/ui/button'
import {apiAdminClientAtom} from '@/client/state/globalState'

import {useQuery, useQueryClient} from '@tanstack/react-query'
import {parseResponse} from 'hono/client'
import {useAtomValue} from 'jotai'
import {DownloadIcon, TriangleAlertIcon} from 'lucide-react'

const lastBackupQueryKey = ['admin', 'last-backup'] as const

export function DatabaseBackup() {
  const adminClient = useAtomValue(apiAdminClientAtom)
  const queryClient = useQueryClient()
  const {data: lastBackupData, isLoading: isLastBackupLoading} = useQuery({
    queryKey: lastBackupQueryKey,
    queryFn: () => parseResponse(adminClient['last-backup'].$get()),
    refetchInterval: query =>
      query.state.data?.inProgressSince ? 5000 : false,
  })
  const {lastBackup, inProgressSince, lastFailureAt} = lastBackupData ?? {}

  function handleDownload() {
    /**
     * Point a hidden <a> at the endpoint and let the browser's native
     * download manager handle the response. The server sets
     * `Content-Disposition: attachment`, so the body streams straight to
     * disk — nothing is buffered in JS, regardless of database size.
     */
    const a = document.createElement('a')
    a.href = adminClient['backup-database'].$url().toString()
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()

    /**
     * Refetch shortly after the click so the `'started'` row the server
     * just inserted shows up. Polling then continues every 5s (see
     * `refetchInterval`) until the row flips to `'complete'` or `'fail'`
     * and `inProgressSince` clears.
     */
    setTimeout(() => {
      queryClient.invalidateQueries({queryKey: lastBackupQueryKey})
    }, 500)
  }

  return (
    <>
      <div>
        <p className="text-muted-foreground text-sm">
          Last backup:{' '}
          {isLastBackupLoading ? (
            <AudioLoader width={14} height={14} bars={3} gap={1} rounded={1} />
          ) : lastBackup ? (
            new Date(lastBackup).toLocaleString()
          ) : (
            'never'
          )}
        </p>
        {inProgressSince && (
          <p className="relative text-muted-foreground text-sm">
            <SonarPulse className="absolute top-1/2 -left-3.5 -translate-y-1/2" />
            Backup in progress since{' '}
            {new Date(inProgressSince).toLocaleTimeString()}
          </p>
        )}
        {/*
         * `lastFailureAt` only clears once a *successful* backup overtakes it
         * server-side. If the user retries after a failure, the new `'started'`
         * row sets `inProgressSince` while `lastFailureAt` still reflects the
         * prior failure — gate on `!inProgressSince` so the stale failure
         * banner doesn't render alongside the in-progress indicator.
         */}
        {!inProgressSince && lastFailureAt && (
          <p className="flex items-center gap-1 text-destructive text-sm">
            <TriangleAlertIcon className="size-3.5" />
            Last attempt failed at{' '}
            {new Date(lastFailureAt).toLocaleTimeString()}
          </p>
        )}
      </div>
      <Button onClick={handleDownload} disabled={!!inProgressSince}>
        <DownloadIcon /> Download backup
      </Button>
    </>
  )
}
