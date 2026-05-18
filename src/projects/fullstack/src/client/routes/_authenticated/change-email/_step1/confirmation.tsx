import {createFileRoute, notFound} from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/change-email/_step1/confirmation'
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

    return {changeEmailConfirmed: 'token' in search}
  },
})
