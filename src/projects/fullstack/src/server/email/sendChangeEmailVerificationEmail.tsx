import {isProd} from '@/server/constants'

import {Resend} from 'resend'

import {getEnvVar} from '../utils/getEnvVar'
import ChangeEmailVerificationEmail from './ChangeEmailVerificationEmail'

type ChangeEmailVerificationEmailParams = {
  user: {email: string}
  newEmail: string
  url: string
}

export async function sendChangeEmailVerificationEmail({
  user,
  newEmail,
  url,
}: ChangeEmailVerificationEmailParams) {
  const testRecipient = getEnvVar('RESEND_TEST_RECIPIENT', {shouldThrow: false})
  const apiKey = getEnvVar('RESEND_API_KEY')
  const resend = new Resend(apiKey)

  await resend.emails.send({
    from: 'onboarding@resend.dev', // TODO - change this to an official supercharge email
    to: isProd ? user.email : testRecipient,
    subject: 'Confirm your updated Supercharge email',
    react: ChangeEmailVerificationEmail({verificationUrl: url, newEmail}),
  })
}
