import type {JSX} from 'react'
import type {ErrorContext} from '@/shared/errorContext'

import {isProd} from '@/server/constants'
import {captureError} from '@/server/errorCapture/captureError'
import {getEnvVar} from '@/server/utils/getEnvVar'

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
        captureError({
          error: res.error,
          context: rejectionContext,
          metadata: res.headers === null ? undefined : {headers: res.headers},
        })
      }
    })
    .catch(error => {
      captureError({error, context: exceptionContext})
    })
}
