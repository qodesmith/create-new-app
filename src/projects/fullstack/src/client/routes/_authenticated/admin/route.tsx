import {defaultAuthedPath} from '@/client/constants'

import {createFileRoute, redirect} from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: ({context}) => {
    if (context.user.role !== 'admin') {
      throw redirect({to: defaultAuthedPath, replace: true})
    }
  },
})
