import type {ErrorContext} from '@/shared/types'

import {getDatabase} from '@/server/db/getDatabase'
import {errorsTable} from '@/server/db/schema/appSchema'

import {bestEffort, errorToObject} from '@qodestack/utils'

/**
 * Persists an error to the `errors` table. Best-effort: never throws, never
 * blocks. The deep module — every server-side capture site goes through this
 * single function rather than re-implementing the `getDatabase` + `errorToObject`
 * + `bestEffort` + `db.insert(...)` chain.
 *
 * `error` accepts anything (Error, string, plain object, response body) and is
 * normalized via `errorToObject`. Pass already-shaped objects (e.g. a fabricated
 * `{message, ...}`) through as-is — they're left intact.
 */
export function captureError({
  context,
  error,
  metadata,
  userId,
}: {
  context: ErrorContext
  error: unknown
  metadata?: Record<string, unknown> | null
  userId?: string | null
}): void {
  const db = getDatabase()
  const normalizedError =
    error && typeof error === 'object' && !(error instanceof Error)
      ? (error as Record<string, unknown>)
      : errorToObject(error)

  bestEffort(
    () => {
      db.insert(errorsTable)
        .values({
          context,
          error: normalizedError,
          metadata: metadata ?? undefined,
          userId: userId ?? undefined,
        })
        .run()
    },
    {log: true}
  )
}
