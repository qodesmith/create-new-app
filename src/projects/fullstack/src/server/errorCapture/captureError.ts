import type {ErrorContext} from '@/shared/errorContext'

import {getDatabase} from '@/server/db/getDatabase'
import {errorsTable} from '@/server/db/schema/appSchema'

import {bestEffort, errorToObject} from '@qodestack/utils'

export function captureError({
  error,
  context,
  metadata,
  userId,
}: {
  error: unknown
  context: ErrorContext
  metadata?: Record<string, unknown>
  userId?: string | null
}): void {
  bestEffort(
    () => {
      const values = {
        error: errorToObject(error),
        context,
        ...(metadata === undefined ? {} : {metadata}),
        ...(userId === undefined ? {} : {userId}),
      }

      getDatabase()
        .insert(errorsTable)
        .values(values)
        .run()
    },
    {log: true}
  )
}
