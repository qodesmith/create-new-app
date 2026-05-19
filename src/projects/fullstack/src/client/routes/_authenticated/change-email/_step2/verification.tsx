import {defaultAuthedPath} from '@/client/constants'

import {createFileRoute, notFound, redirect} from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/change-email/_step2/verification'
)({
  beforeLoad: ctx => {
    const search = ctx.search as {token?: string; error?: string}

    if (!(search.error || search.token)) {
      throw notFound()
    }

    if (search.token) {
      throw redirect({to: defaultAuthedPath, replace: true})
    }

    // If we get here, the component will render an expired message.
  },
})
