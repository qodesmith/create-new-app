import type {JSX} from 'react'
import type {ErrorContext} from '@/shared/types'

import {isProd} from '@/server/constants'
import {getDatabase} from '@/server/db/getDatabase'
import {errorsTable} from '@/server/db/schema/appSchema'
import {getEnvVar} from '@/server/utils/getEnvVar'

import {errorToObject} from '@qodestack/utils'
import {Resend} from 'resend'

export async function sendEmail({
  user,
  subject,
  react,
  rejectionContext,
  exceptionContext,
}: {
  user: {email: string}
  subject: string
  react: JSX.Element
  rejectionContext: ErrorContext
  exceptionContext: ErrorContext
}) {
  const apiKey = getEnvVar('RESEND_API_KEY')
  const resend = new Resend(apiKey)
  const from = getEnvVar('RESEND_FROM_EMAIL')
  const to = isProd ? user.email : getEnvVar('RESEND_ACCOUNT_EMAIL')

  return resend.emails
    .send({from, to, subject, react})
    .then(res => {
      if (res.error !== null) {
        const db = getDatabase()
        const error = errorToObject(res.error)
        const metadata = res.headers !== null ? {headers: res.headers} : null

        db.insert(errorsTable)
          .values({context: rejectionContext, error, metadata})
          .run()
      }
    })
    .catch(e => {
      const db = getDatabase()
      const error = errorToObject(e)

      db.insert(errorsTable).values({context: exceptionContext, error}).run()
    })
}
