import {createFileRoute, notFound} from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/change-email/_step1/confirmation'
)({
  beforeLoad: ctx => {
    const search = ctx.search as {error?: string; data?: string}

    /**
     * Better Auth only appends `error` to query params when the token is
     * expired. It appends nothing when the token is valid, making it impossible
     * to differentiate between a valid state or someone simply visiting the
     * callbackURL directly.
     *
     * Therefore, we manually append a `data` query param as a custom convention
     * inside the `sendChangeEmailConfirmation` function to distinguish
     * successful redirects from direct callbackURL visits.
     */
    if (!(search.error || search.data)) {
      throw notFound()
    }

    return {changeEmailConfirmed: !search.error}
  },
})
