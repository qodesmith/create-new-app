import {defaultAuthedPath} from '@/client/constants'

import {createFileRoute, notFound, redirect} from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/change-email/_step2/verification'
)({
  validateSearch: (search: {
    token?: string
    error?: string
  }): {token: string} | {error: string} | null => {
    const {token, error} = search

    if (token && !error) {
      return {token}
    }

    if (error && !token) {
      return {error}
    }

    return null
  },
  beforeLoad: ({search}) => {
    if (search === null) {
      throw notFound()
    }

    if ('data' in search) {
      throw redirect({to: defaultAuthedPath, replace: true})
    }

    // If we get here, we'll show an expired message.
  },
})
