import {callbackURLSuccessParam} from '@/shared/constants'

import {createFileRoute, notFound} from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/change-email/_step1/confirmation'
)({
  beforeLoad: ctx => {
    const search = ctx.search as {
      error?: string
      [callbackURLSuccessParam]?: string
    }

    /**
     * Better Auth only appends an `error` query param to the callbackURL when
     * the token is expired. Nothing is appended when the token is valid, making
     * it impossible to distinguish between a successful redirect and someone
     * simply visiting the callbackURL directly.
     *
     * To bridge that gap, `sendChangeEmailConfirmation` manually appends the
     * `callbackURLSuccessParam` query param (set to a random hex value) to the
     * callbackURL before sending the confirmation email. Its presence here
     * indicates the user arrived via a valid confirmation link.
     */
    if (!(search.error || search[callbackURLSuccessParam])) {
      throw notFound()
    }

    return {changeEmailConfirmed: !search.error}
  },
})
